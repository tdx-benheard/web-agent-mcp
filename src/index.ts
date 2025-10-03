#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { chromium, Browser, Page, BrowserContext } from 'playwright';
import sharp from 'sharp';
import { createWorker } from 'tesseract.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Browser management
let browser: Browser | null = null;
let context: BrowserContext | null = null;
let currentPage: Page | null = null;
let ocrWorker: any = null;

// Screenshot storage directory
const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots');

// Ensure screenshot directory exists
async function ensureScreenshotDir() {
  try {
    await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating screenshot directory:', error);
  }
}

// Initialize browser
async function initBrowser() {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    currentPage = await context.newPage();
  }
  return currentPage!;
}

// Initialize OCR worker
async function initOCR() {
  if (!ocrWorker) {
    ocrWorker = await createWorker('eng');
  }
  return ocrWorker;
}

// Clean up resources
async function cleanup() {
  if (browser) {
    await browser.close();
    browser = null;
    context = null;
    currentPage = null;
  }
  if (ocrWorker) {
    await ocrWorker.terminate();
    ocrWorker = null;
  }
}

// Create MCP server
const server = new Server(
  {
    name: 'web-agent-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {}
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'navigate',
      description: 'Navigate to a URL',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'The URL to navigate to' },
          waitUntil: {
            type: 'string',
            description: 'When to consider navigation complete',
            enum: ['load', 'domcontentloaded', 'networkidle'],
            default: 'load'
          }
        },
        required: ['url']
      }
    },
    {
      name: 'click',
      description: 'Click on an element',
      inputSchema: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: 'CSS selector or text to click' },
          clickCount: { type: 'number', description: 'Number of clicks', default: 1 },
          button: {
            type: 'string',
            description: 'Mouse button to use',
            enum: ['left', 'right', 'middle'],
            default: 'left'
          }
        },
        required: ['selector']
      }
    },
    {
      name: 'type',
      description: 'Type text into an input field',
      inputSchema: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: 'CSS selector of the input field' },
          text: { type: 'string', description: 'Text to type' },
          delay: { type: 'number', description: 'Delay between keystrokes in ms', default: 0 }
        },
        required: ['selector', 'text']
      }
    },
    {
      name: 'login',
      description: 'Perform login action with username and password',
      inputSchema: {
        type: 'object',
        properties: {
          usernameSelector: { type: 'string', description: 'CSS selector for username field' },
          passwordSelector: { type: 'string', description: 'CSS selector for password field' },
          username: { type: 'string', description: 'Username to enter' },
          password: { type: 'string', description: 'Password to enter' },
          submitSelector: { type: 'string', description: 'CSS selector for submit button' }
        },
        required: ['usernameSelector', 'passwordSelector', 'username', 'password', 'submitSelector']
      }
    },
    {
      name: 'screenshot',
      description: 'Take a screenshot of the current page',
      inputSchema: {
        type: 'object',
        properties: {
          fullPage: { type: 'boolean', description: 'Capture full page', default: false },
          selector: { type: 'string', description: 'CSS selector to capture specific element' },
          filename: { type: 'string', description: 'Custom filename for screenshot' }
        }
      }
    },
    {
      name: 'parse_screenshot',
      description: 'Parse text from a screenshot using OCR',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string', description: 'Screenshot filename to parse' },
          language: { type: 'string', description: 'OCR language', default: 'eng' }
        },
        required: ['filename']
      }
    },
    {
      name: 'get_page_content',
      description: 'Get the current page content (HTML or text)',
      inputSchema: {
        type: 'object',
        properties: {
          format: {
            type: 'string',
            description: 'Content format',
            enum: ['html', 'text'],
            default: 'text'
          }
        }
      }
    },
    {
      name: 'wait',
      description: 'Wait for a condition or selector',
      inputSchema: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: 'CSS selector to wait for' },
          timeout: { type: 'number', description: 'Timeout in milliseconds', default: 30000 },
          state: {
            type: 'string',
            description: 'State to wait for',
            enum: ['attached', 'detached', 'visible', 'hidden'],
            default: 'visible'
          }
        }
      }
    },
    {
      name: 'scroll',
      description: 'Scroll the page',
      inputSchema: {
        type: 'object',
        properties: {
          direction: {
            type: 'string',
            description: 'Scroll direction',
            enum: ['up', 'down', 'left', 'right'],
            default: 'down'
          },
          amount: { type: 'number', description: 'Amount to scroll in pixels', default: 500 }
        }
      }
    },
    {
      name: 'go_back',
      description: 'Navigate back in browser history',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'go_forward',
      description: 'Navigate forward in browser history',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'refresh',
      description: 'Refresh the current page',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'get_cookies',
      description: 'Get browser cookies',
      inputSchema: {
        type: 'object',
        properties: {
          urls: { type: 'array', items: { type: 'string' }, description: 'Filter cookies by URLs' }
        }
      }
    },
    {
      name: 'set_cookie',
      description: 'Set a browser cookie',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Cookie name' },
          value: { type: 'string', description: 'Cookie value' },
          domain: { type: 'string', description: 'Cookie domain' },
          path: { type: 'string', description: 'Cookie path', default: '/' }
        },
        required: ['name', 'value']
      }
    },
    {
      name: 'list_screenshots',
      description: 'List all saved screenshots',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'press_key',
      description: 'Press a keyboard key or key combination',
      inputSchema: {
        type: 'object',
        properties: {
          key: {
            type: 'string',
            description: 'Key to press (e.g., "Enter", "Tab", "ArrowDown", "a", "Control+C"). Supports modifiers: Control/Shift/Alt/Meta'
          },
          delay: {
            type: 'number',
            description: 'Delay in ms before pressing the key',
            default: 0
          }
        },
        required: ['key']
      }
    }
  ]
}));

// Handle resource listing
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  await ensureScreenshotDir();
  const screenshots = await fs.readdir(SCREENSHOT_DIR);

  return {
    resources: screenshots
      .filter(file => file.endsWith('.png') || file.endsWith('.jpg'))
      .map(file => ({
        uri: `screenshot://${file}`,
        name: file,
        description: `Screenshot: ${file}`,
        mimeType: file.endsWith('.png') ? 'image/png' : 'image/jpeg'
      }))
  };
});

// Handle resource reading
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;

  if (uri.startsWith('screenshot://')) {
    const filename = uri.replace('screenshot://', '');
    const filepath = path.join(SCREENSHOT_DIR, filename);

    try {
      const content = await fs.readFile(filepath);
      const mimeType = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';

      return {
        contents: [{
          uri,
          mimeType,
          blob: content.toString('base64')
        }]
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to read screenshot: ${error}`
      );
    }
  }

  throw new McpError(
    ErrorCode.InvalidRequest,
    `Unknown resource: ${uri}`
  );
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    switch (name) {
      case 'navigate': {
        const page = await initBrowser();
        const url = String(args.url || '');
        const waitUntil = args.waitUntil as 'load' | 'domcontentloaded' | 'networkidle' || 'load';

        const response = await page.goto(url, {
          waitUntil,
          timeout: 60000
        });

        return {
          content: [{
            type: 'text',
            text: `Navigated to ${url}. Status: ${response?.status()}`
          }]
        };
      }

      case 'click': {
        const page = await initBrowser();
        const selector = String(args.selector || '');
        const clickCount = Number(args.clickCount) || 1;
        const button = (args.button as 'left' | 'right' | 'middle') || 'left';

        // Try to click by text first, then by selector
        try {
          await page.click(`text="${selector}"`, {
            clickCount,
            button,
            timeout: 5000
          });
        } catch {
          await page.click(selector, {
            clickCount,
            button
          });
        }

        return {
          content: [{
            type: 'text',
            text: `Clicked on element: ${selector}`
          }]
        };
      }

      case 'type': {
        const page = await initBrowser();
        const selector = String(args.selector || '');
        const text = String(args.text || '');
        const delay = Number(args.delay) || 0;

        await page.fill(selector, text);

        if (delay > 0) {
          await page.type(selector, text, { delay });
        }

        return {
          content: [{
            type: 'text',
            text: `Typed text into ${selector}`
          }]
        };
      }

      case 'login': {
        const page = await initBrowser();
        const usernameSelector = String(args.usernameSelector || '');
        const passwordSelector = String(args.passwordSelector || '');
        const username = String(args.username || '');
        const password = String(args.password || '');
        const submitSelector = String(args.submitSelector || '');

        // Fill username
        await page.fill(usernameSelector, username);

        // Fill password
        await page.fill(passwordSelector, password);

        // Click submit
        await page.click(submitSelector);

        // Wait for navigation
        await page.waitForLoadState('networkidle', { timeout: 30000 });

        return {
          content: [{
            type: 'text',
            text: 'Login completed successfully'
          }]
        };
      }

      case 'screenshot': {
        const page = await initBrowser();
        await ensureScreenshotDir();

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = String(args.filename || `screenshot-${timestamp}.png`);
        const filepath = path.join(SCREENSHOT_DIR, filename);
        const fullPage = Boolean(args.fullPage);
        const selector = args.selector ? String(args.selector) : null;

        if (selector) {
          const element = await page.$(selector);
          if (element) {
            await element.screenshot({ path: filepath });
          } else {
            throw new Error(`Element not found: ${selector}`);
          }
        } else {
          await page.screenshot({
            path: filepath,
            fullPage
          });
        }

        return {
          content: [{
            type: 'text',
            text: `Screenshot saved as ${filename}`
          }]
        };
      }

      case 'parse_screenshot': {
        await ensureScreenshotDir();
        const filename = String(args.filename || '');
        const filepath = path.join(SCREENSHOT_DIR, filename);

        // Check if file exists
        await fs.access(filepath);

        // Initialize OCR if needed
        const worker = await initOCR();

        // Perform OCR
        const { data: { text } } = await worker.recognize(filepath);

        return {
          content: [{
            type: 'text',
            text: `Extracted text from ${filename}:\n\n${text}`
          }]
        };
      }

      case 'get_page_content': {
        const page = await initBrowser();
        const format = String(args.format || 'text');

        let content: string;
        if (format === 'html') {
          content = await page.content();
        } else {
          content = await page.textContent('body') || '';
        }

        return {
          content: [{
            type: 'text',
            text: content
          }]
        };
      }

      case 'wait': {
        const page = await initBrowser();
        const selector = args.selector ? String(args.selector) : null;
        const timeout = Number(args.timeout) || 30000;
        const state = (args.state as 'attached' | 'detached' | 'visible' | 'hidden') || 'visible';

        if (selector) {
          await page.waitForSelector(selector, {
            timeout,
            state
          });

          return {
            content: [{
              type: 'text',
              text: `Element ${selector} is now ${state}`
            }]
          };
        }

        // If no selector, just wait
        await page.waitForTimeout(timeout);
        return {
          content: [{
            type: 'text',
            text: `Waited for ${timeout}ms`
          }]
        };
      }

      case 'scroll': {
        const page = await initBrowser();
        const direction = String(args.direction || 'down');
        const amount = Number(args.amount) || 500;

        let scrollCode = '';
        switch (direction) {
          case 'up':
            scrollCode = `window.scrollBy(0, -${amount})`;
            break;
          case 'down':
            scrollCode = `window.scrollBy(0, ${amount})`;
            break;
          case 'left':
            scrollCode = `window.scrollBy(-${amount}, 0)`;
            break;
          case 'right':
            scrollCode = `window.scrollBy(${amount}, 0)`;
            break;
          default:
            scrollCode = `window.scrollBy(0, ${amount})`;
        }

        await page.evaluate(scrollCode);

        return {
          content: [{
            type: 'text',
            text: `Scrolled ${direction} by ${amount}px`
          }]
        };
      }

      case 'go_back': {
        const page = await initBrowser();
        await page.goBack();
        return {
          content: [{
            type: 'text',
            text: 'Navigated back in history'
          }]
        };
      }

      case 'go_forward': {
        const page = await initBrowser();
        await page.goForward();
        return {
          content: [{
            type: 'text',
            text: 'Navigated forward in history'
          }]
        };
      }

      case 'refresh': {
        const page = await initBrowser();
        await page.reload();
        return {
          content: [{
            type: 'text',
            text: 'Page refreshed'
          }]
        };
      }

      case 'get_cookies': {
        if (!context) await initBrowser();
        const urls = args.urls as string[] | undefined;
        const cookies = await context!.cookies(urls);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(cookies, null, 2)
          }]
        };
      }

      case 'set_cookie': {
        if (!context) await initBrowser();

        const name = String(args.name || '');
        const value = String(args.value || '');
        const domain = args.domain ? String(args.domain) : undefined;
        const path = String(args.path || '/');

        await context!.addCookies([{
          name,
          value,
          domain,
          path
        }]);

        return {
          content: [{
            type: 'text',
            text: `Cookie ${name} set successfully`
          }]
        };
      }

      case 'list_screenshots': {
        await ensureScreenshotDir();
        const screenshots = await fs.readdir(SCREENSHOT_DIR);
        const imageFiles = screenshots.filter(f => f.endsWith('.png') || f.endsWith('.jpg'));

        return {
          content: [{
            type: 'text',
            text: imageFiles.length > 0
              ? `Screenshots:\n${imageFiles.join('\n')}`
              : 'No screenshots found'
          }]
        };
      }

      case 'press_key': {
        const page = await initBrowser();
        const key = String(args.key || '');
        const delay = Number(args.delay) || 0;

        if (delay > 0) {
          await page.waitForTimeout(delay);
        }

        // Check if it's a key combination (e.g., "Control+C")
        if (key.includes('+')) {
          const keys = key.split('+');
          const modifiers = keys.slice(0, -1);
          const mainKey = keys[keys.length - 1];

          // Press modifiers
          for (const modifier of modifiers) {
            await page.keyboard.down(modifier);
          }

          // Press main key
          await page.keyboard.press(mainKey);

          // Release modifiers in reverse order
          for (let i = modifiers.length - 1; i >= 0; i--) {
            await page.keyboard.up(modifiers[i]);
          }

          return {
            content: [{
              type: 'text',
              text: `Pressed key combination: ${key}`
            }]
          };
        } else {
          // Single key press
          await page.keyboard.press(key);

          return {
            content: [{
              type: 'text',
              text: `Pressed key: ${key}`
            }]
          };
        }
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error) {
    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error}`
    );
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Web Agent MCP Server running on stdio');

  // Cleanup on exit
  process.on('SIGINT', async () => {
    await cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await cleanup();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});