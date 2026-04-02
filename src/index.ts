/**
 * QR Code MCP — wraps api.qrserver.com (free, no auth)
 *
 * Tools:
 * - create_qr: Generate a QR code image URL for any text or URL
 * - read_qr: Decode a QR code from an image URL
 */

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
}

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
      'Generate a QR code for any text or URL. Returns the image URL — no image is fetched. The URL can be embedded directly in an <img> tag or downloaded.',
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
    description: 'Decode a QR code from a publicly accessible image URL. Returns the decoded text.',
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
  const params = new URLSearchParams({ fileurl: url });
  const res = await fetch(`${BASE_URL}/read-qr-code/?${params}`);
  if (!res.ok) throw new Error(`QR Server error: ${res.status}`);
  const data = (await res.json()) as RawReadResponse;
  const symbol = data?.[0]?.symbol?.[0];
  if (!symbol) throw new Error('QR Server returned an unexpected response');
  if (symbol.error) throw new Error(`QR decode error: ${symbol.error}`);
  return { decoded: symbol.data ?? '' };
}

export default { tools, callTool } satisfies McpToolExport;
