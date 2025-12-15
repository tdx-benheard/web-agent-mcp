import { getConsoleMessages, initBrowser } from '../browser.js';
import { ToolResult } from '../types.js';

/**
 * Get console messages from the browser
 */
export async function handleGetConsoleLogs(args: { clear?: boolean; filter?: string; limit?: number }): Promise<ToolResult> {
  const clear = args.clear ?? false;
  const filter = args.filter?.toLowerCase();
  const limit = args.limit ?? 50; // Default to 50 most recent messages

  let messages = getConsoleMessages(clear);

  // Apply filter if specified
  if (filter) {
    messages = messages.filter(msg =>
      msg.type === filter || msg.text.toLowerCase().includes(filter)
    );
  }

  if (messages.length === 0) {
    return {
      content: [{
        type: 'text',
        text: 'No console messages found'
      }]
    };
  }

  const totalMessages = messages.length;

  // Limit to most recent N messages
  if (limit > 0 && messages.length > limit) {
    messages = messages.slice(-limit); // Get last N messages
  }

  // Format messages for display
  const formattedMessages = messages.map((msg, index) => {
    const time = new Date(msg.timestamp).toISOString();
    const location = msg.location ? ` (${msg.location})` : '';
    const actualIndex = totalMessages > limit ? totalMessages - limit + index + 1 : index + 1;
    return `[${actualIndex}] [${time}] [${msg.type}]${location}: ${msg.text}`;
  }).join('\n\n');

  const limitText = totalMessages > limit ? ` (showing last ${limit} of ${totalMessages})` : '';

  return {
    content: [{
      type: 'text',
      text: `Console messages${limitText}:\n\n${formattedMessages}`
    }]
  };
}

/**
 * Execute JavaScript code in the browser console
 */
export async function handleExecuteConsole(args: { code: string }): Promise<ToolResult> {
  const page = await initBrowser();
  const { code } = args;

  try {
    // Execute the JavaScript code in the browser context
    const result = await page.evaluate((codeToExecute) => {
      try {
        // Execute the code and return the result
        const evalResult = eval(codeToExecute);

        // Handle different return types
        if (evalResult === undefined) {
          return { success: true, result: 'undefined' };
        } else if (evalResult === null) {
          return { success: true, result: 'null' };
        } else if (typeof evalResult === 'function') {
          return { success: true, result: evalResult.toString() };
        } else if (typeof evalResult === 'object') {
          try {
            return { success: true, result: JSON.stringify(evalResult, null, 2) };
          } catch {
            return { success: true, result: evalResult.toString() };
          }
        } else {
          return { success: true, result: String(evalResult) };
        }
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }, code);

    if (result.success) {
      return {
        content: [{
          type: 'text',
          text: `Execution successful. Result:\n${result.result}`
        }]
      };
    } else {
      return {
        content: [{
          type: 'text',
          text: `Execution failed: ${result.error}`
        }],
        isError: true
      };
    }
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `Failed to execute console command: ${error.message}`
      }],
      isError: true
    };
  }
}
