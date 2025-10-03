# AAMCP Browser Server

An MCP (Model Context Protocol) server that provides browser automation capabilities to Claude Desktop and Claude Code.

## Features

- **Browser Navigation**: Navigate to any website
- **Element Interaction**: Click buttons, fill forms, type text
- **Login Automation**: Automated login with username/password
- **Screenshot Capture**: Take full-page or element-specific screenshots
- **OCR Capabilities**: Parse text from screenshots using Tesseract.js
- **Cookie Management**: Get and set browser cookies
- **Page Content Extraction**: Get HTML or text content
- **Browser History**: Navigate back/forward, refresh pages
- **Scrolling**: Programmatic page scrolling
- **Wait Conditions**: Wait for elements or conditions

## Installation

1. Navigate to the AAMCP directory:
```bash
cd C:\AAMCP
```

2. Install dependencies:
```bash
npm install
```

3. Build the TypeScript code:
```bash
npm run build
```

4. Install Playwright browsers:
```bash
npx playwright install chromium
```

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
- `parse_screenshot` - Extract text from a screenshot using OCR
- `list_screenshots` - List all saved screenshots

### Content Tools
- `get_page_content` - Get page content as HTML or text
- `get_cookies` - Get browser cookies
- `set_cookie` - Set a browser cookie

### Utility Tools
- `wait` - Wait for an element or timeout
- `scroll` - Scroll the page in any direction

## Usage in Claude Code

After restarting Claude Desktop, the MCP server tools will be available. You can use them like:

```
Use the navigate tool to go to https://example.com
Take a screenshot of the page
Parse the screenshot to extract text
```

## Directory Structure

```
C:\AAMCP\
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

### OCR not working
1. Tesseract.js should auto-download language data
2. Check network connection for first-time setup

## Development

To modify the server:

1. Edit files in `src/`
2. Rebuild: `npm run build`
3. Restart Claude Desktop to apply changes

## Security Notes

- The server runs with local permissions
- Screenshots are stored locally in `C:\AAMCP\screenshots\`
- Cookies and credentials are handled in memory only
- Browser runs in sandboxed mode