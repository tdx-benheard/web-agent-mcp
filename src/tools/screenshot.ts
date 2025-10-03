import { initBrowser, initOCR } from '../browser.js';
import { ScreenshotArgs, ParseScreenshotArgs, ToolResult } from '../types.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Screenshot storage directory
const SCREENSHOT_DIR = path.join(__dirname, '..', '..', 'screenshots');

/**
 * Ensure screenshot directory exists
 */
export async function ensureScreenshotDir(): Promise<void> {
  try {
    await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating screenshot directory:', error);
  }
}

export async function handleScreenshot(args: ScreenshotArgs): Promise<ToolResult> {
  const page = await initBrowser();
  await ensureScreenshotDir();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = args.filename || `screenshot-${timestamp}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  const { fullPage = false, selector } = args;

  if (selector) {
    const element = await page.$(selector);
    if (element) {
      await element.screenshot({ path: filepath });
    } else {
      throw new Error(`Element not found: ${selector}`);
    }
  } else {
    await page.screenshot({
      path: filepath,
      fullPage
    });
  }

  return {
    content: [{
      type: 'text',
      text: `Screenshot saved as ${filename}`
    }]
  };
}

export async function handleParseScreenshot(args: ParseScreenshotArgs): Promise<ToolResult> {
  await ensureScreenshotDir();
  const { filename } = args;
  const filepath = path.join(SCREENSHOT_DIR, filename);

  // Check if file exists
  await fs.access(filepath);

  // Initialize OCR if needed
  const worker = await initOCR();

  // Perform OCR
  const { data: { text } } = await worker.recognize(filepath);

  return {
    content: [{
      type: 'text',
      text: `Extracted text from ${filename}:\n\n${text}`
    }]
  };
}

export async function handleListScreenshots(): Promise<ToolResult> {
  await ensureScreenshotDir();
  const screenshots = await fs.readdir(SCREENSHOT_DIR);
  const imageFiles = screenshots.filter(f => f.endsWith('.png') || f.endsWith('.jpg'));

  return {
    content: [{
      type: 'text',
      text: imageFiles.length > 0
        ? `Screenshots:\n${imageFiles.join('\n')}`
        : 'No screenshots found'
    }]
  };
}

export { SCREENSHOT_DIR };
