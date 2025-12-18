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

// Import browser management
import { cleanup } from './browser.js';

// Import tool definitions
import { toolDefinitions } from './tool-definitions.js';

// Import resource handlers
import { listScreenshotResources, readScreenshotResource } from './resources.js';

// Import tool handlers - navigation
import { handleNavigate, handleGoBack, handleGoForward, handleRefresh } from './tools/navigation.js';

// Import tool handlers - interaction
import { handleClick, handleType, handlePressKey, handleScroll, handleWait } from './tools/interaction.js';

// Import tool handlers - auth
import { handleLogin, handleGetCookies, handleSetCookie } from './tools/auth.js';

// Import tool handlers - screenshot
import { handleScreenshot, handleListScreenshots } from './tools/screenshot.js';

// Import tool handlers - content
import { handleGetPageContent, handleQueryPage } from './tools/content.js';

// Import tool handlers - debugging
import { handleGetConsoleLogs, handleExecuteConsole } from './tools/debugging.js';

// Import types
import {
  NavigateArgs,
  ClickArgs,
  TypeArgs,
  LoginArgs,
  ScreenshotArgs,
  GetPageContentArgs,
  WaitArgs,
  ScrollArgs,
  GetCookiesArgs,
  SetCookieArgs,
  PressKeyArgs,
  QueryPageArgs
} from './types.js';

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
  tools: toolDefinitions
}));

// Handle resource listing
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return await listScreenshotResources();
});

// Handle resource reading
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  return await readScreenshotResource(request.params.uri);
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    switch (name) {
      // Navigation tools
      case 'navigate':
        return await handleNavigate(args as unknown as NavigateArgs) as never;
      case 'go_back':
        return await handleGoBack() as never;
      case 'go_forward':
        return await handleGoForward() as never;
      case 'refresh':
        return await handleRefresh() as never;

      // Interaction tools
      case 'click':
        return await handleClick(args as unknown as ClickArgs) as never;
      case 'type':
        return await handleType(args as unknown as TypeArgs) as never;
      case 'press_key':
        return await handlePressKey(args as unknown as PressKeyArgs) as never;
      case 'scroll':
        return await handleScroll(args as unknown as ScrollArgs) as never;
      case 'wait':
        return await handleWait(args as unknown as WaitArgs) as never;

      // Auth tools
      case 'login':
        return await handleLogin(args as unknown as LoginArgs) as never;
      case 'get_cookies':
        return await handleGetCookies(args as unknown as GetCookiesArgs) as never;
      case 'set_cookie':
        return await handleSetCookie(args as unknown as SetCookieArgs) as never;

      // Screenshot tools
      case 'screenshot':
        return await handleScreenshot(args as unknown as ScreenshotArgs) as never;
      case 'list_screenshots':
        return await handleListScreenshots() as never;

      // Content tools
      case 'get_page_content':
        return await handleGetPageContent(args as unknown as GetPageContentArgs) as never;
      case 'query_page':
        return await handleQueryPage(args as unknown as QueryPageArgs) as never;

      // Debugging tools
      case 'get_console_logs':
        return await handleGetConsoleLogs(args as { clear?: boolean; filter?: string }) as never;
      case 'execute_console':
        return await handleExecuteConsole(args as { code: string }) as never;

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
