# mcp-qrcode

QR Code MCP — wraps api.qrserver.com (free, no auth)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `create_qr` | Generate a scannable QR code from text or URLs. Returns an image URL ready to embed or download. Use when you need to encode information into a QR code. |
| `read_qr` | Decode QR code images to extract embedded text or URLs. Returns the decoded content. Use when you need to read what's stored in a QR code. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "qrcode": {
      "url": "https://gateway.pipeworx.io/qrcode/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Qrcode data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
