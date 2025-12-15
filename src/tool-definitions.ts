import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const toolDefinitions: Tool[] = [
  {
    name: 'navigate',
    description: 'Go to URL',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        waitUntil: { type: 'string', enum: ['load', 'domcontentloaded', 'networkidle'], default: 'load' }
      },
      required: ['url']
    }
  },
  {
    name: 'click',
    description: 'Click element',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string' },
        clickCount: { type: 'number', default: 1 },
        button: { type: 'string', enum: ['left', 'right', 'middle'], default: 'left' }
      },
      required: ['selector']
    }
  },
  {
    name: 'type',
    description: 'Type into input. Supports base64:/dpapi: prefix for encoded passwords.',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string' },
        text: { type: 'string' },
        delay: { type: 'number', default: 0 }
      },
      required: ['selector', 'text']
    }
  },
  {
    name: 'login',
    description: 'Login with credentials. Supports base64:/dpapi: prefix for encoded passwords.',
    inputSchema: {
      type: 'object',
      properties: {
        usernameSelector: { type: 'string' },
        passwordSelector: { type: 'string' },
        username: { type: 'string' },
        password: { type: 'string', format: 'password' },
        submitSelector: { type: 'string' }
      },
      required: ['usernameSelector', 'passwordSelector', 'username', 'password', 'submitSelector']
    }
  },
  {
    name: 'screenshot',
    description: 'Capture screenshot with optional thumbnail/OCR. Auto-deletes screenshots older than 7 days, keeps 10 most recent.',
    inputSchema: {
      type: 'object',
      properties: {
        fullPage: { type: 'boolean', default: false },
        selector: { type: 'string' },
        filename: { type: 'string' },
        directory: { type: 'string' },
        thumbnail: { type: 'boolean', default: false, description: 'Generate 400px thumbnail (saves context)' },
        autoOcr: { type: 'boolean', default: false, description: 'Automatically extract text via OCR' }
      }
    }
  },
  {
    name: 'parse_screenshot',
    description: 'OCR text from screenshot',
    inputSchema: {
      type: 'object',
      properties: {
        filename: { type: 'string' },
        language: { type: 'string', default: 'eng' }
      },
      required: ['filename']
    }
  },
  {
    name: 'get_page_content',
    description: 'Get page HTML or text',
    inputSchema: {
      type: 'object',
      properties: {
        format: { type: 'string', enum: ['html', 'text'], default: 'text' }
      }
    }
  },
  {
    name: 'wait',
    description: 'Wait for selector/condition',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string' },
        timeout: { type: 'number', default: 14000 },
        state: { type: 'string', enum: ['attached', 'detached', 'visible', 'hidden'], default: 'visible' }
      }
    }
  },
  {
    name: 'scroll',
    description: 'Scroll page',
    inputSchema: {
      type: 'object',
      properties: {
        direction: { type: 'string', enum: ['up', 'down', 'left', 'right'], default: 'down' },
        amount: { type: 'number', default: 500 }
      }
    }
  },
  {
    name: 'go_back',
    description: 'Browser back',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'go_forward',
    description: 'Browser forward',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'refresh',
    description: 'Reload page',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'get_cookies',
    description: 'Get cookies',
    inputSchema: {
      type: 'object',
      properties: {
        urls: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  {
    name: 'set_cookie',
    description: 'Set cookie',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        value: { type: 'string' },
        domain: { type: 'string' },
        path: { type: 'string', default: '/' }
      },
      required: ['name', 'value']
    }
  },
  {
    name: 'list_screenshots',
    description: 'List screenshots',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'press_key',
    description: 'Press key (Enter, Tab, Control+C, etc)',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        delay: { type: 'number', default: 0 }
      },
      required: ['key']
    }
  },
  {
    name: 'query_page',
    description: 'Extract DOM elements by CSS selector',
    inputSchema: {
      type: 'object',
      properties: {
        queries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              selector: { type: 'string' },
              extract: { type: 'string', enum: ['text', 'innerText', 'html', 'outerHTML'], default: 'text' },
              index: { type: 'number' },
              all: { type: 'boolean', default: false }
            },
            required: ['name', 'selector']
          }
        }
      },
      required: ['queries']
    }
  },
  {
    name: 'get_console_logs',
    description: 'Get browser console messages',
    inputSchema: {
      type: 'object',
      properties: {
        clear: { type: 'boolean', default: false },
        filter: { type: 'string' }
      }
    }
  },
  {
    name: 'execute_console',
    description: 'Run JS in browser console',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string' }
      },
      required: ['code']
    }
  }
];
