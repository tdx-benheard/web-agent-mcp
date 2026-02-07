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
    description: 'Type into input. Supports base64:/dpapi: prefix for passwords.',
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
    description: 'Login with credentials. Supports base64:/dpapi: prefix for passwords.',
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
    description: 'Capture 800px JPEG (saves context). Use hiRes:true only when critical. Max 20 kept.',
    inputSchema: {
      type: 'object',
      properties: {
        fullPage: { type: 'boolean', default: false },
        selector: { type: 'string' },
        filename: { type: 'string', description: 'Filename with .jpg extension (e.g., page.jpg)' },
        directory: { type: 'string' },
        hiRes: { type: 'boolean', default: false }
      }
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
    description: 'Extract DOM elements by CSS selector. Returns metadata showing total matches to prevent wasteful re-queries.',
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
              extract: { type: 'string', enum: ['text', 'innerText', 'html', 'outerHTML'], default: 'text', description: 'What to extract. html/outerHTML are expensive (1000+ tokens/element) - prefer text or use execute_console.' },
              index: { type: 'number', description: 'Select specific element by index (0-based, negative for end)' },
              max: { type: 'number', default: 5, description: 'Max results (1=string, >1=array, 0=unlimited, default=5)' },
              allowLargeResults: { type: 'boolean', description: 'Allow large html/outerHTML results. Default truncates at 1000 chars/element.' }
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
    description: 'Get browser console messages (default: 50, use limit to control)',
    inputSchema: {
      type: 'object',
      properties: {
        clear: { type: 'boolean', default: false },
        filter: { type: 'string' },
        limit: { type: 'number', default: 50 }
      }
    }
  },
  {
    name: 'execute_console',
    description: 'Run JS in browser console',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        allowLargeResults: { type: 'boolean', default: false, description: 'Allow results >1000 chars. Default truncates to save tokens.' }
      },
      required: ['code']
    }
  },
  {
    name: 'get_dialogs',
    description: 'Get captured browser dialogs (alert/confirm/prompt). Handler is ALWAYS active, auto-captures to prevent hangs.',
    inputSchema: {
      type: 'object',
      properties: {
        clear: { type: 'boolean', default: false },
        filter: { type: 'string' },
        limit: { type: 'number', default: 50 }
      }
    }
  },
  {
    name: 'configure_dialog_handler',
    description: 'Configure auto-handling of dialogs (default: auto-accept). Handler is event-driven and ALWAYS active.',
    inputSchema: {
      type: 'object',
      properties: {
        autoHandle: { type: 'boolean' },
        defaultAction: { type: 'string', enum: ['accept', 'dismiss'] },
        promptText: { type: 'string' }
      }
    }
  },
  {
    name: 'switch_to_iframe',
    description: 'Switch to iframe by selector/name/index',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string' },
        name: { type: 'string' },
        index: { type: 'number' }
      }
    }
  },
  {
    name: 'switch_to_main_content',
    description: 'Switch to main page from iframe',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'list_iframes',
    description: 'List iframes on page',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'get_current_frame',
    description: 'Get current frame context',
    inputSchema: { type: 'object', properties: {} }
  }
];
