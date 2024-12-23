# markdown2pdf-mcp

An MCP server for converting Markdown documents to PDF files. This server provides a simple and efficient way to generate PDFs from Markdown content with support for syntax highlighting and custom styling. Inspired by Alan Shaw's [markdown-pdf](https://github.com/alanshaw/markdown-pdf).

## Features

- Convert Markdown to PDF with a single command
- Syntax highlighting for code blocks
- Custom CSS styling for PDF output
- Support for standard Markdown formatting

## Limitations

The following markdown elements are not supported:

- LaTeX math equations (e.g., `$x^2$` or `$$\sum_{i=1}^n x_i$$`)
- Complex mathematical formulas or scientific notation

Stick to these supported markdown elements:

- Headers (all levels)
- Text formatting (bold, italic, strikethrough)
- Lists (ordered and unordered)
- Code blocks with syntax highlighting
- Tables
- Blockquotes
- Links
- Images (both local files and external URLs)
- Task lists

## Installation

```bash
# Clone the repository
git clone https://github.com/2b3pro/markdown2pdf-mcp.git

# Navigate to the project directory
cd markdown2pdf-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

### Starting the Server

```bash
npm start
```

### Using the MCP Tool

The server provides a single tool `create_pdf_from_markdown` with the following parameters:

```typescript
{
  // Required parameters
  markdown: string;    // Markdown content to convert

  // Optional parameters with defaults
  outputPath?: string;  // Path where the PDF should be saved (defaults to MCP settings DEFAULT_OUTPUT_PATH)
  paperFormat?: string;     // 'letter' (default), 'a4', 'a3', 'a5', 'legal', 'tabloid'
  paperOrientation?: string; // 'portrait' (default), 'landscape'
  paperBorder?: string;     // '2cm' (default), accepts decimal values with CSS units (e.g., '1.5cm', '2.5mm', '0.5in', '10.5px')
}
```

Example with options:

```typescript
await use_mcp_tool({
  server_name: "markdown2pdf",
  tool_name: "create_pdf_from_markdown",
  arguments: {
    markdown: "# Hello World\n\nThis is a test document.",
    outputPath: "output.pdf",
    paperFormat: "a4",
    paperOrientation: "landscape",
    paperBorder: "1.5cm",
  },
});
```

Example usage in an MCP client:

```typescript
await use_mcp_tool({
  server_name: "markdown2pdf",
  tool_name: "create_pdf_from_markdown",
  arguments: {
    markdown: "# Hello World\n\nThis is a test document.",
    outputPath: "output.pdf",
  },
});
```

## Configuration

### Default Output Path

You can configure the default output path in your MCP settings file:

```json
{
  "mcpServers": {
    "markdown2pdf": {
      "command": "node",
      "args": ["path/to/markdown2pdf-mcp/build/index.js"],
      "env": {
        "M2P_DEFAULT_OUTPUT_PATH": "/path/to/default/output.pdf"
      }
    }
  }
}
```

If no output path is provided in the tool arguments, it will use the configured default path. The tool also automatically handles file name conflicts by appending incremental numbers (e.g., output.pdf, output-1.pdf, output-2.pdf).

## Dependencies

- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/sdk) - MCP SDK for server implementation
- [remarkable](https://github.com/jonschlinkert/remarkable) - Markdown parser
- [highlight.js](https://github.com/highlightjs/highlight.js) - Syntax highlighting
- [phantomjs-prebuilt](https://github.com/Medium/phantomjs) - PDF generation
- [tmp](https://github.com/raszi/node-tmp) - Temporary file handling

## Development

```bash
# Build the project
npm run build

# Start the server
npm start
```

## License

MIT @ Ian Shen

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
