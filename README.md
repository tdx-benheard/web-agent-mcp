# Web Agent MCP Server

An MCP (Model Context Protocol) server that provides browser automation capabilities to Claude Desktop and Claude Code.

## Features

- **Browser Navigation**: Navigate to any website
- **Element Interaction**: Click buttons, fill forms, type text
- **Login Automation**: Automated login with username/password
- **Screenshot Capture**: Take full-page or element-specific screenshots
- **Cookie Management**: Get and set browser cookies
- **Page Content Extraction**: Get HTML or text content
- **Browser History**: Navigate back/forward, refresh pages
- **Scrolling**: Programmatic page scrolling
- **Wait Conditions**: Wait for elements or conditions
- **Iframe Support**: Switch context between main page and iframes

## Quick Start

```bash
# Clone the repository
git clone https://github.com/tdx-benheard/web-agent-mcp.git
cd web-agent-mcp

# Install dependencies
npm install

# Install Playwright browser
npx playwright install chromium

# Build the project
npm run build

# Start the server
npm start
```

For detailed installation instructions, see [INSTALL.md](INSTALL.md).

## Configuration


The server is configured in Claude Desktop via the configuration file at:
`%APPDATA%\Claude\claude_desktop_config.json`

The configuration has already been set up to make this server available globally in all Claude Code instances.

## Available Tools

### Navigation Tools
- `navigate` - Navigate to a URL
- `go_back` - Go back in browser history
- `go_forward` - Go forward in browser history
- `refresh` - Refresh the current page

### Interaction Tools
- `click` - Click on an element (by selector or text)
- `type` - Type text into an input field
- `login` - Perform login with username/password

### Screenshot Tools
- `screenshot` - Take a screenshot (full page or specific element)
- `list_screenshots` - List all saved screenshots

### Content Tools
- `get_page_content` - Get page content as HTML or text
- `get_cookies` - Get browser cookies
- `set_cookie` - Set a browser cookie

### Utility Tools
- `wait` - Wait for an element or timeout
- `scroll` - Scroll the page in any direction
- `press_key` - Press keyboard keys or key combinations
- `query_page` - Extract DOM elements by CSS selector

### Iframe Tools
- `list_iframes` - List all iframes on the current page
- `switch_to_iframe` - Switch context to an iframe (by selector, name, or index)
- `switch_to_main_content` - Switch back to main page content
- `get_current_frame` - Get current frame context

### Debugging Tools
- `get_console_logs` - Get browser console messages
- `execute_console` - Execute JavaScript in browser console

## Usage in Claude Code

After restarting Claude Desktop, the MCP server tools will be available. You can use them like:

```
Use the navigate tool to go to https://example.com
Take a screenshot of the page
```

## Directory Structure

```
C:\source\mcp\web-agent-mcp\
├── src/              # TypeScript source files
│   └── index.ts      # Main server implementation
├── dist/             # Compiled JavaScript files
├── screenshots/      # Saved screenshots
├── package.json      # Node.js dependencies
├── tsconfig.json     # TypeScript configuration
├── .env             # Environment variables
└── README.md        # This file
```

## Troubleshooting

### Server not appearing in Claude
1. Restart Claude Desktop after configuration
2. Check logs at `%APPDATA%\Claude\logs\`

### Browser automation issues
1. Ensure Chromium is installed: `npx playwright install chromium`
2. Check if running in headless mode (configured in code)

## Development

To modify the server:

1. Edit files in `src/`
2. Rebuild: `npm run build`
3. Restart Claude Desktop to apply changes

## Security Notes

- The server runs with local permissions
- Screenshots are stored locally in `C:\source\mcp\web-agent-mcp\screenshots\`
- Cookies and credentials are handled in memory only
- Browser runs in sandboxed mode