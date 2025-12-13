import { Page, BrowserContext, Browser } from 'playwright';
import { Worker } from 'tesseract.js';

// Console message type
export interface ConsoleMessage {
  type: string;
  text: string;
  timestamp: number;
  location?: string;
}

// Browser state
export interface BrowserState {
  browser: Browser | null;
  context: BrowserContext | null;
  currentPage: Page | null;
  ocrWorker: Worker | null;
  consoleMessages: ConsoleMessage[];
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
}

export interface ParseScreenshotArgs {
  filename: string;
  language?: string;
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
    all?: boolean;
  }>;
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
  all?: boolean;
}

export type QueryResults = Record<string, string | string[] | null>;
