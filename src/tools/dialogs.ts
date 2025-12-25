import { getDialogMessages, configureDialogHandler, getDialogHandlerConfig } from '../browser.js';
import { GetDialogsArgs, ConfigureDialogHandlerArgs, ToolResult, DialogHandlerConfig } from '../types.js';

/**
 * Get captured browser dialogs (alert, confirm, prompt, beforeunload)
 *
 * The dialog handler is ALWAYS ACTIVE and event-driven - it automatically
 * captures any dialogs that appear during automation without you needing
 * to explicitly "look for" them. This prevents automation from hanging
 * when dialogs appear unexpectedly.
 */
export async function getDialogs(args: GetDialogsArgs): Promise<ToolResult> {
  try {
    const { clear = false, filter, limit = 50 } = args;

    let messages = getDialogMessages(clear);

    // Apply filter if specified
    if (filter) {
      const filterLower = filter.toLowerCase();
      messages = messages.filter(msg =>
        msg.type.toLowerCase() === filterLower ||
        msg.message.toLowerCase().includes(filterLower)
      );
    }

    // Apply limit (0 = unlimited)
    if (limit > 0) {
      messages = messages.slice(-limit);
    }

    if (messages.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No dialogs captured' + (filter ? ` matching filter: ${filter}` : '')
        }]
      };
    }

    const output = messages.map(msg => {
      const time = new Date(msg.timestamp).toISOString();
      let details = `[${time}] ${msg.type.toUpperCase()}: ${msg.message}`;

      if (msg.defaultValue) {
        details += `\n  Default: ${msg.defaultValue}`;
      }

      if (msg.handled) {
        details += `\n  Handled: ${msg.response}`;
        if (msg.promptText !== undefined) {
          details += ` (with text: "${msg.promptText}")`;
        }
      }

      return details;
    }).join('\n\n');

    return {
      content: [{
        type: 'text',
        text: `Captured ${messages.length} dialog${messages.length === 1 ? '' : 's'}${limit > 0 && messages.length === limit ? ` (showing last ${limit})` : ''}:\n\n${output}`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error getting dialogs: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}

/**
 * Configure how the browser handles dialogs automatically
 *
 * By default, dialogs are auto-accepted to prevent automation from hanging.
 * You can configure the behavior:
 * - autoHandle: Whether to automatically handle dialogs (default: true)
 * - defaultAction: 'accept' or 'dismiss' (default: 'accept')
 * - promptText: Default text for prompt() dialogs (default: empty string)
 *
 * Note: The handler is event-driven and ALWAYS active once configured.
 */
export async function configureDialogHandlerTool(args: ConfigureDialogHandlerArgs): Promise<ToolResult> {
  try {
    const { autoHandle, defaultAction, promptText } = args;

    const updates: Partial<DialogHandlerConfig> = {};
    if (autoHandle !== undefined) updates.autoHandle = autoHandle;
    if (defaultAction !== undefined) updates.defaultAction = defaultAction;
    if (promptText !== undefined) updates.promptText = promptText;

    configureDialogHandler(updates);
    const config = getDialogHandlerConfig();

    return {
      content: [{
        type: 'text',
        text: `Dialog handler configured:\n` +
              `  Auto-handle: ${config.autoHandle}\n` +
              `  Default action: ${config.defaultAction}\n` +
              `  Prompt text: ${config.promptText !== undefined ? `"${config.promptText}"` : '(empty)'}\n\n` +
              `The dialog handler is now active and will automatically handle any dialogs that appear.`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error configuring dialog handler: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}
