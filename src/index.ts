#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Remarkable } from 'remarkable';
import hljs from 'highlight.js';
import tmp from 'tmp';
import { spawn } from 'child_process';
import phantomjs from 'phantomjs-prebuilt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

tmp.setGracefulCleanup();

class MarkdownPdfServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'markdown2pdf',
        version: '1.2.3',
      },
      {
        capabilities: {
          tools: {
            create_pdf_from_markdown: true
          },
        },
      }
    );

    this.setupToolHandlers();
    
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'create_pdf_from_markdown',
          description: 'Convert markdown content to PDF. Note: Cannot handle LaTeX math equations. Supports basic markdown elements like headers, lists, tables, code blocks, blockquotes, and images (both local and external URLs).',
          inputSchema: {
            type: 'object',
            properties: {
              markdown: {
                type: 'string',
                description: 'Markdown content to convert to PDF',
              },
              outputPath: {
                type: 'string',
                description: 'Path where the PDF should be saved. Can be relative (resolved from current working directory) or absolute path. If not provided, defaults to ~/Documents/markdown2pdf/output.pdf. Directory will be created if it doesn\'t exist',
              },
              paperFormat: {
                type: 'string',
                description: 'Paper format for the PDF (default: letter)',
                enum: ['letter', 'a4', 'a3', 'a5', 'legal', 'tabloid'],
                default: 'letter'
              },
              paperOrientation: {
                type: 'string',
                description: 'Paper orientation for the PDF (default: portrait)',
                enum: ['portrait', 'landscape'],
                default: 'portrait'
              },
              paperBorder: {
                type: 'string',
                description: 'Border margin for the PDF (default: 2cm). Use CSS units (cm, mm, in, px)',
                pattern: '^[0-9]+(\.[0-9]+)?(cm|mm|in|px)$',
                default: '20mm'
              }
            },
            required: ['markdown'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name !== 'create_pdf_from_markdown') {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
      }

      // Use HOME environment variable for default output path
      const defaultOutputPath = process.env.M2P_DEFAULT_OUTPUT_PATH 
        ? path.resolve(process.env.M2P_DEFAULT_OUTPUT_PATH)
        : path.resolve(process.env.HOME || process.cwd(), 'Documents', 'markdown2pdf', 'output.pdf');
      const { 
        markdown, 
        outputPath = defaultOutputPath,
        paperFormat = 'letter',
        paperOrientation = 'portrait',
        paperBorder = '2cm'
      } = request.params.arguments as {
        markdown: string;
        outputPath?: string;
        paperFormat?: string;
        paperOrientation?: string;
        paperBorder?: string;
      };

      try {
        await this.convertToPdf(
          markdown,
          outputPath,
          paperFormat,
          paperOrientation,
          paperBorder
        );
        return {
          content: [
            {
              type: 'text',
              text: `Successfully created PDF at ${outputPath}`,
            },
          ],
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Failed to create PDF: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private getIncrementalPath(basePath: string): string {
    const dir = path.dirname(basePath);
    const ext = path.extname(basePath);
    const name = path.basename(basePath, ext);
    let counter = 1;
    let newPath = basePath;

    while (fs.existsSync(newPath)) {
      newPath = path.join(dir, `${name}-${counter}${ext}`);
      counter++;
    }

    return newPath;
  }

  private async convertToPdf(
    markdown: string,
    outputPath: string,
    paperFormat: string = 'letter',
    paperOrientation: string = 'portrait',
    paperBorder: string = '2cm'
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Get incremental path if file exists
      outputPath = this.getIncrementalPath(outputPath);

      // Ensure all paths are absolute
      outputPath = path.resolve(outputPath);
      
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      fs.mkdirSync(outputDir, { recursive: true });
      
      const opts = {
        phantomPath: phantomjs.path,
        runningsPath: path.resolve(__dirname, 'runnings.js'),
        cssPath: path.resolve(__dirname, 'css', 'pdf.css'),
        paperFormat,
        paperOrientation,
        paperBorder,
        renderDelay: 2000, // Increase render delay to ensure styles are loaded
        loadTimeout: 30000, // Increase timeout for larger documents
        remarkable: { breaks: true, preset: 'default' as const },
      };

      // Convert markdown to HTML directly
      const mdParser = new Remarkable(opts.remarkable.preset, {
        highlight: function(str: string, language: string) {
          if (language && hljs.getLanguage(language)) {
            try {
              return hljs.highlight(str, { language }).value;
            } catch (err) {}
          }
          try {
            return hljs.highlightAuto(str).value;
          } catch (err) {}
          return '';
        },
        ...opts.remarkable,
      });

      const html = mdParser.render(markdown);

      // Create temporary HTML file
      tmp.file({ postfix: '.html' }, async (err, tmpHtmlPath, tmpHtmlFd) => {
        if (err) return reject(err);
        fs.closeSync(tmpHtmlFd);

        try {
          // Write HTML content to temporary file
          await fs.promises.writeFile(tmpHtmlPath, html);

          const childArgs = [
            path.resolve(__dirname, 'phantom', 'render.js'),
            path.resolve(tmpHtmlPath),
            outputPath,
            path.resolve(process.cwd()),
            opts.runningsPath,
            opts.cssPath,
            '',
            opts.paperFormat,
            opts.paperOrientation,
            opts.paperBorder,
            String(opts.renderDelay),
            String(opts.loadTimeout),
          ];

          const phantom = spawn(opts.phantomPath, childArgs);

          phantom.stdout.on('data', (data) => {
            console.error(`PhantomJS stdout: ${data}`);
          });

          phantom.stderr.on('data', (data) => {
            console.error(`PhantomJS stderr: ${data}`);
          });

          phantom.on('error', (err) => {
            console.error(`PhantomJS spawn error: ${err}`);
            reject(err);
          });

          phantom.on('close', (code: number) => {
            if (code !== 0) {
              reject(new Error(`PhantomJS process exited with code ${code}`));
            } else {
              resolve();
            }
          });
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Markdown to PDF MCP server running on stdio');
  }
}

const server = new MarkdownPdfServer();
server.run().catch(console.error);
