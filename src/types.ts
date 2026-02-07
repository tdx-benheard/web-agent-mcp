import { Page, BrowserContext, Browser, Frame } from 'playwright';

// Console message type
export interface ConsoleMessage {
  type: string;
  text: string;
  timestamp: number;
  location?: string;
}

// Dialog message type
export interface DialogMessage {
  type: 'alert' | 'confirm' | 'prompt' | 'beforeunload';
  message: string;
  defaultValue?: string;
  timestamp: number;
  handled: boolean;
  response?: 'accept' | 'dismiss';
  promptText?: string;
}

// Dialog handler configuration
export interface DialogHandlerConfig {
  autoHandle: boolean; // Whether to automatically handle dialogs
  defaultAction: 'accept' | 'dismiss'; // Default action for alerts/confirms
  promptText?: string; // Default text for prompts
}

// Browser state
export interface BrowserState {
  browser: Browser | null;
  context: BrowserContext | null;
  currentPage: Page | null;
  consoleMessages: ConsoleMessage[];
  dialogMessages: DialogMessage[];
  dialogHandlerConfig: DialogHandlerConfig;
  currentFrame: Frame | null;
}

// Tool argument types
export interface NavigateArgs {
  url: string;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
}

export interface ClickArgs {
  selector: string;
  clickCount?: number;
  button?: 'left' | 'right' | 'middle';
}

export interface TypeArgs {
  selector: string;
  text: string;
  delay?: number;
}

export interface LoginArgs {
  usernameSelector: string;
  passwordSelector: string;
  username: string;
  password: string;
  submitSelector: string;
}

export interface ScreenshotArgs {
  fullPage?: boolean;
  selector?: string;
  filename?: string;
  directory?: string;
  hiRes?: boolean;
}

export interface GetPageContentArgs {
  format?: 'html' | 'text';
}

export interface WaitArgs {
  selector?: string;
  timeout?: number;
  state?: 'attached' | 'detached' | 'visible' | 'hidden';
}

export interface ScrollArgs {
  direction?: 'up' | 'down' | 'left' | 'right';
  amount?: number;
}

export interface GetCookiesArgs {
  urls?: string[];
}

export interface SetCookieArgs {
  name: string;
  value: string;
  domain?: string;
  path?: string;
}

export interface PressKeyArgs {
  key: string;
  delay?: number;
}

export interface QueryPageArgs {
  queries: Array<{
    name: string;
    selector: string;
    extract?: 'text' | 'innerText' | 'html' | 'outerHTML';
    index?: number;
    max?: number;
    allowLargeResults?: boolean;
  }>;
}

export interface SwitchToIframeArgs {
  selector?: string;
  name?: string;
  index?: number;
}

export interface GetConsoleLogsArgs {
  clear?: boolean;
  filter?: string;
  limit?: number;
}

export interface ExecuteConsoleArgs {
  code: string;
  allowLargeResults?: boolean;
}

export interface GetDialogsArgs {
  clear?: boolean;
  filter?: string; // Filter by dialog type
  limit?: number;
}

export interface ConfigureDialogHandlerArgs {
  autoHandle?: boolean;
  defaultAction?: 'accept' | 'dismiss';
  promptText?: string;
}

// Tool result type (matches MCP SDK CallToolResult)
export interface ToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

// Query specification for page evaluation
export interface QuerySpec {
  name: string;
  selector: string;
  extract?: 'text' | 'innerText' | 'html' | 'outerHTML';
  index?: number;
  max?: number;
  allowLargeResults?: boolean;
}

export type QueryResults = Record<string, string | string[] | null>;
