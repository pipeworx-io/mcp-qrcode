# mcp-qrcode

MCP server for QR code generation and decoding via [api.qrserver.com](https://goqr.me/api/). Free, no auth required.

## Tools

| Tool | Description |
|------|-------------|
| `create_qr` | Generate a QR code image URL for any text or URL |
| `read_qr` | Decode a QR code from a publicly accessible image URL |

## Quickstart (Pipeworx Gateway)

```bash
curl -X POST https://gateway.pipeworx.io/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "qrcode_create_qr",
      "arguments": { "data": "https://pipeworx.io" }
    },
    "id": 1
  }'
```

## License

MIT
