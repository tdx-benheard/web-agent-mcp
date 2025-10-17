import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const toolDefinitions: Tool[] = [
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
        timeout: { type: 'number', description: 'Timeout in milliseconds', default: 14000 },
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
  },
  {
    name: 'query_page',
    description: 'Extract specific DOM element content efficiently using CSS selectors. Returns only the requested data, using significantly fewer tokens than get_page_content.',
    inputSchema: {
      type: 'object',
      properties: {
        queries: {
          type: 'array',
          description: 'Array of queries to extract from the page',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Name for this query result (used as key in returned object)'
              },
              selector: {
                type: 'string',
                description: 'CSS selector to target the element(s)'
              },
              extract: {
                type: 'string',
                description: 'What to extract from the element',
                enum: ['text', 'innerText', 'html', 'outerHTML'],
                default: 'text'
              },
              index: {
                type: 'number',
                description: 'Which element to select if multiple match (0-based, -1 for last). Ignored if all is true.'
              },
              all: {
                type: 'boolean',
                description: 'If true, returns an array of all matching elements. If false or not provided, returns single element based on index.',
                default: false
              }
            },
            required: ['name', 'selector']
          }
        }
      },
      required: ['queries']
    }
  }
];
