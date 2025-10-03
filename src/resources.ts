import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ensureScreenshotDir, SCREENSHOT_DIR } from './tools/screenshot.js';

/**
 * List all available screenshot resources
 */
export async function listScreenshotResources() {
  await ensureScreenshotDir();
  const screenshots = await fs.readdir(SCREENSHOT_DIR);

  return {
    resources: screenshots
      .filter(file => file.endsWith('.png') || file.endsWith('.jpg'))
      .map(file => ({
        uri: `screenshot://${file}`,
        name: file,
        description: `Screenshot: ${file}`,
        mimeType: file.endsWith('.png') ? 'image/png' : 'image/jpeg'
      }))
  };
}

/**
 * Read a screenshot resource
 */
export async function readScreenshotResource(uri: string) {
  if (!uri.startsWith('screenshot://')) {
    throw new McpError(
      ErrorCode.InvalidRequest,
      `Unknown resource: ${uri}`
    );
  }

  const filename = uri.replace('screenshot://', '');
  const filepath = path.join(SCREENSHOT_DIR, filename);

  try {
    const content = await fs.readFile(filepath);
    const mimeType = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';

    return {
      contents: [{
        uri,
        mimeType,
        blob: content.toString('base64')
      }]
    };
  } catch (error) {
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to read screenshot: ${error}`
    );
  }
}
