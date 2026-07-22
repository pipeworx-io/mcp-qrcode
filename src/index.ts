interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * QR Code MCP — wraps api.qrserver.com (free, no auth)
 *
 * Tools:
 * - create_qr: Generate a QR code image URL for any text or URL
 * - read_qr: Decode a QR code from an image URL
 */


const BASE_URL = 'https://api.qrserver.com/v1';

type RawReadResponse = Array<{
  symbol: Array<{
    data: string | null;
    error: string | null;
  }>;
}>;

const tools: McpToolExport['tools'] = [
  {
    name: 'create_qr',
    description:
      'Generate a scannable QR code from text or URLs. Returns an image URL ready to embed or download. Use when you need to encode information into a QR code.',
    inputSchema: {
      type: 'object',
      properties: {
        data: {
          type: 'string',
          description: 'The text or URL to encode in the QR code.',
        },
        size: {
          type: 'number',
          description: 'Width and height of the QR code image in pixels (default 200).',
        },
      },
      required: ['data'],
    },
  },
  {
    name: 'read_qr',
    description: 'Decode QR code images to extract embedded text or URLs. Returns the decoded content. Use when you need to read what\'s stored in a QR code.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Publicly accessible URL of the QR code image to decode.',
        },
      },
      required: ['url'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'create_qr':
      return createQr(args.data as string, (args.size as number | undefined) ?? 200);
    case 'read_qr':
      return readQr(args.url as string);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function createQr(data: string, size: number) {
  const safeSize = Math.min(1000, Math.max(10, size));
  const params = new URLSearchParams({
    size: `${safeSize}x${safeSize}`,
    data,
  });
  const imageUrl = `${BASE_URL}/create-qr-code/?${params}`;
  return {
    url: imageUrl,
    size: safeSize,
    data,
  };
}

async function readQr(url: string) {
  if (!/^https?:\/\//i.test(url)) {
    throw new Error('read_qr requires a publicly accessible http(s) image URL of the QR code, e.g. "https://example.com/qr.png".');
  }
  // qrserver's server-side `fileurl` fetch is broken (returns "download error"
  // for every URL → 100% failures). Download the image ourselves and POST the
  // bytes as multipart instead — qrserver decodes uploaded files reliably.
  const imgRes = await fetch(url, { headers: { 'User-Agent': 'Pipeworx/1.0 (pipeworx.io)' } });
  if (!imgRes.ok) {
    throw new Error(`Could not download the QR image from ${url} (HTTP ${imgRes.status}). Make sure it's a public, direct image URL.`);
  }
  const bytes = new Uint8Array(await imgRes.arrayBuffer());
  const ct = imgRes.headers.get('content-type') || 'image/png';
  const form = new FormData();
  form.append('file', new Blob([bytes], { type: ct }), 'qr.png');

  const res = await fetch(`${BASE_URL}/read-qr-code/`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`QR Server error: ${res.status}`);
  const data = (await res.json()) as RawReadResponse;
  const symbol = data?.[0]?.symbol?.[0];
  if (!symbol) throw new Error('QR Server returned an unexpected response');
  if (symbol.error) throw new Error(`QR decode error: ${symbol.error} (the image may not contain a readable QR code).`);
  return { decoded: symbol.data ?? '', source_url: url };
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
