# Installation Guide for Web Agent MCP Server

## Prerequisites

Before installing this MCP server, ensure you have:

- **Claude Desktop** application installed ([Download](https://claude.ai/download))
- **Node.js** version 18.0 or higher ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Git** for cloning the repository

## Quick Start

```bash
# Clone the repository
git clone <your-repository-url>
cd web-agent-mcp

# Install all dependencies
npm install

# Install Playwright browser
npx playwright install chromium

# Build the TypeScript project
npm run build

# Test the server (optional)
npm start
```

## Detailed Installation Steps

### 1. System Requirements

#### Windows
- Windows 10/11 (64-bit)
- Visual C++ Redistributable (usually pre-installed)

#### macOS
- macOS 10.15 or higher
- Xcode Command Line Tools: `xcode-select --install`

#### Linux (Ubuntu/Debian)
```bash
# Install system dependencies for Playwright
sudo npx playwright install-deps
```

### 2. Install Node.js Dependencies

All JavaScript dependencies will be installed automatically:

```bash
npm install
```

This installs:
- **playwright** (^1.40.0) - Browser automation
- **sharp** (^0.33.0) - Image processing (may compile native bindings)
- **tesseract.js** (^5.0.0) - OCR text extraction
- **@modelcontextprotocol/sdk** (^1.0.0) - MCP protocol
- **dotenv** (^16.3.1) - Environment configuration

### 3. Install Playwright Browser

Playwright needs to download Chromium browser separately:

```bash
npx playwright install chromium
```

This downloads ~150MB of browser binaries to `~/.cache/ms-playwright/`

### 4. Build the Project

Compile TypeScript to JavaScript:

```bash
npm run build
```

This creates the `dist/` directory with compiled JavaScript files.

## Configuration

### Environment Variables

Create or update `.env` file if you need custom settings:

```env
# Example .env file
HEADLESS=true
SCREENSHOT_DIR=./screenshots
```

### MCP Client Configuration

For Claude Desktop, add to `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "web-agent": {
      "command": "node",
      "args": ["C:\\path\\to\\web-agent-mcp\\dist\\index.js"]
    }
  }
}
```

## Verification

Test that everything is installed correctly:

```bash
# Run the test script
node test-server.js

# Or start the server directly
npm start
```

## Troubleshooting

### Common Issues

1. **"Cannot find module 'playwright'"**
   ```bash
   npm install
   npx playwright install chromium
   ```

2. **"sharp: Command failed" during npm install**
   - On Windows: Install Visual Studio Build Tools
   - On macOS: Install Xcode Command Line Tools
   - On Linux: `sudo apt-get install build-essential`

3. **"Browser executable not found"**
   ```bash
   npx playwright install chromium
   # If that fails:
   npx playwright install-deps
   ```

4. **Tesseract.js downloads failing**
   - This happens on first run when OCR is used
   - Requires internet connection to download language data
   - Files are cached in `node_modules/tesseract.js`

5. **TypeScript build errors**
   ```bash
   npm run build
   # Check for any missing type definitions
   npm install --save-dev @types/node
   ```

## What Another AI Would Need

When sharing this with another AI or developer, they would need:

1. This repository with all source files
2. The `package.json` and `package-lock.json` files (for exact versions)
3. Any `.env` configuration (sanitized of secrets)
4. This installation guide

The AI/developer can then follow these steps and the dependencies will be automatically recognized from `package.json`. The only manual step is installing the Playwright browser binary.

## Optional: Docker Setup

For easier sharing, you could create a Dockerfile:

```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npx playwright install chromium
RUN npx playwright install-deps
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

This would bundle everything into a single container image.