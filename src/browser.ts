import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { createWorker, Worker } from 'tesseract.js';
import { BrowserState } from './types.js';

// Global browser state
const state: BrowserState = {
  browser: null,
  context: null,
  currentPage: null,
  ocrWorker: null,
  consoleMessages: []
};

/**
 * Initialize the browser and return the current page
 */
export async function initBrowser(): Promise<Page> {
  if (!state.browser) {
    state.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    state.context = await state.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    state.currentPage = await state.context.newPage();

    // Set up console message listener
    state.currentPage.on('console', (msg) => {
      state.consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now(),
        location: msg.location() ? `${msg.location().url}:${msg.location().lineNumber}` : undefined
      });
    });
  }
  return state.currentPage!;
}

/**
 * Get the current browser context
 */
export function getContext(): BrowserContext | null {
  return state.context;
}

/**
 * Get console messages and optionally clear them
 */
export function getConsoleMessages(clear: boolean = false) {
  const messages = [...state.consoleMessages];
  if (clear) {
    state.consoleMessages = [];
  }
  return messages;
}

/**
 * Initialize OCR worker
 */
export async function initOCR(): Promise<Worker> {
  if (!state.ocrWorker) {
    state.ocrWorker = await createWorker('eng');
  }
  return state.ocrWorker;
}

/**
 * Clean up all browser and OCR resources
 */
export async function cleanup(): Promise<void> {
  if (state.browser) {
    await state.browser.close();
    state.browser = null;
    state.context = null;
    state.currentPage = null;
  }
  if (state.ocrWorker) {
    await state.ocrWorker.terminate();
    state.ocrWorker = null;
  }
}
