import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { BrowserState } from './types.js';

// Constants
const MAX_DIALOG_BUFFER_SIZE = 1000; // Prevent unbounded memory growth

// Global browser state
const state: BrowserState = {
  browser: null,
  context: null,
  currentPage: null,
  consoleMessages: [],
  dialogMessages: [],
  dialogHandlerConfig: {
    autoHandle: true,
    defaultAction: 'accept'
  },
  currentFrame: null
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

    // Set up dialog handler (ALWAYS ACTIVE - event-driven)
    state.currentPage.on('dialog', async (dialog) => {
      const dialogInfo = {
        type: dialog.type() as 'alert' | 'confirm' | 'prompt' | 'beforeunload',
        message: dialog.message(),
        defaultValue: dialog.defaultValue(),
        timestamp: Date.now(),
        handled: false,
        response: undefined as 'accept' | 'dismiss' | undefined,
        promptText: undefined as string | undefined
      };

      // Handle dialog based on configuration
      if (state.dialogHandlerConfig.autoHandle) {
        const action = state.dialogHandlerConfig.defaultAction;
        dialogInfo.handled = true;
        dialogInfo.response = action;

        if (dialog.type() === 'prompt' && action === 'accept') {
          const promptText = state.dialogHandlerConfig.promptText || '';
          dialogInfo.promptText = promptText;
          await dialog.accept(promptText);
        } else if (action === 'accept') {
          await dialog.accept();
        } else {
          await dialog.dismiss();
        }
      } else {
        // If not auto-handling, default to accepting to prevent hangs
        dialogInfo.handled = true;
        dialogInfo.response = 'accept';
        await dialog.accept();
      }

      state.dialogMessages.push(dialogInfo);

      // Prevent unbounded memory growth in long-running sessions
      if (state.dialogMessages.length > MAX_DIALOG_BUFFER_SIZE) {
        state.dialogMessages = state.dialogMessages.slice(-MAX_DIALOG_BUFFER_SIZE);
      }
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
 * Get dialog messages and optionally clear them
 *
 * @param clear - If true, clears the dialog message buffer after reading
 * @returns Array of captured dialog messages (defensive copy)
 *
 * Note: Buffer is automatically trimmed to MAX_DIALOG_BUFFER_SIZE (1000)
 * to prevent unbounded memory growth in long-running sessions.
 */
export function getDialogMessages(clear: boolean = false) {
  const messages = [...state.dialogMessages];
  if (clear) {
    state.dialogMessages = [];
  }
  return messages;
}

/**
 * Configure dialog handler behavior
 *
 * @param config - Partial configuration object with properties to update
 *
 * Configuration options:
 * - autoHandle: Whether to automatically handle dialogs (default: true)
 * - defaultAction: 'accept' or 'dismiss' (default: 'accept')
 * - promptText: Text to provide for prompt() dialogs (default: empty string)
 *
 * Changes apply immediately to all future dialogs.
 */
export function configureDialogHandler(config: Partial<typeof state.dialogHandlerConfig>) {
  state.dialogHandlerConfig = {
    ...state.dialogHandlerConfig,
    ...config
  };
}

/**
 * Get current dialog handler configuration
 *
 * @returns Defensive copy of current configuration
 */
export function getDialogHandlerConfig() {
  return { ...state.dialogHandlerConfig };
}

/**
 * Set the current frame context
 */
export function setCurrentFrame(frame: any): void {
  state.currentFrame = frame;
}

/**
 * Get the current frame context
 */
export function getCurrentFrame(): any {
  return state.currentFrame;
}

/**
 * Clear the current frame context (return to main page)
 */
export function clearCurrentFrame(): void {
  state.currentFrame = null;
}

/**
 * Clean up all browser resources
 */
export async function cleanup(): Promise<void> {
  if (state.browser) {
    await state.browser.close();
    state.browser = null;
    state.context = null;
    state.currentPage = null;
    state.currentFrame = null;
  }
}
