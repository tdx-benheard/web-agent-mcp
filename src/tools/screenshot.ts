import { initBrowser, initOCR } from '../browser.js';
import { ScreenshotArgs, ParseScreenshotArgs, ToolResult } from '../types.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Screenshot storage directory
const SCREENSHOT_DIR = path.join(__dirname, '..', '..', 'screenshots');

// Cleanup configuration
const MAX_SCREENSHOT_AGE_DAYS = 30; // Delete screenshots older than 30 days
const MIN_SCREENSHOTS_TO_KEEP = 10; // Always keep at least this many recent screenshots
const THUMBNAIL_WIDTH = 400; // Thumbnail width in pixels

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

/**
 * Create a thumbnail version of a screenshot
 */
async function createThumbnail(originalPath: string): Promise<string> {
  const ext = path.extname(originalPath);
  const thumbnailPath = originalPath.replace(ext, `-thumb${ext}`);

  await sharp(originalPath)
    .resize(THUMBNAIL_WIDTH, null, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .toFile(thumbnailPath);

  return thumbnailPath;
}

/**
 * Cleanup old screenshots with hybrid strategy:
 * - Delete screenshots older than MAX_SCREENSHOT_AGE_DAYS
 * - Always keep at least MIN_SCREENSHOTS_TO_KEEP most recent screenshots
 */
async function cleanupOldScreenshots(targetDir: string = SCREENSHOT_DIR): Promise<{ deleted: number, kept: number }> {
  try {
    const files = await fs.readdir(targetDir);
    const imageFiles = files.filter(f =>
      (f.endsWith('.png') || f.endsWith('.jpg')) && !f.includes('-thumb')
    );

    if (imageFiles.length === 0) {
      return { deleted: 0, kept: 0 };
    }

    // Get file stats
    const fileStats = await Promise.all(
      imageFiles.map(async (filename) => {
        const filepath = path.join(targetDir, filename);
        const stats = await fs.stat(filepath);
        return {
          filename,
          filepath,
          mtime: stats.mtimeMs
        };
      })
    );

    // Sort by modification time (newest first)
    fileStats.sort((a, b) => b.mtime - a.mtime);

    // Determine which files to delete
    const now = Date.now();
    const maxAge = MAX_SCREENSHOT_AGE_DAYS * 24 * 60 * 60 * 1000;
    const toDelete: typeof fileStats = [];

    for (let i = 0; i < fileStats.length; i++) {
      const file = fileStats[i];
      const age = now - file.mtime;

      // Keep if within minimum count
      if (i < MIN_SCREENSHOTS_TO_KEEP) {
        continue;
      }

      // Delete if older than max age
      if (age > maxAge) {
        toDelete.push(file);
      }
    }

    // Delete old files and their thumbnails
    let deletedCount = 0;
    for (const file of toDelete) {
      try {
        await fs.unlink(file.filepath);
        deletedCount++;

        // Try to delete thumbnail too
        const ext = path.extname(file.filepath);
        const thumbPath = file.filepath.replace(ext, `-thumb${ext}`);
        try {
          await fs.unlink(thumbPath);
        } catch {
          // Thumbnail might not exist, ignore
        }
      } catch (error) {
        console.error(`Error deleting ${file.filename}:`, error);
      }
    }

    return { deleted: deletedCount, kept: fileStats.length - deletedCount };
  } catch (error) {
    console.error('Error during cleanup:', error);
    return { deleted: 0, kept: 0 };
  }
}

export async function handleScreenshot(args: ScreenshotArgs): Promise<ToolResult> {
  const page = await initBrowser();

  // Use custom directory if provided (absolute path), otherwise use default
  const targetDir = args.directory || SCREENSHOT_DIR;

  // Ensure the target directory exists
  try {
    await fs.mkdir(targetDir, { recursive: true });
  } catch (error) {
    console.error('Error creating screenshot directory:', error);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = args.filename || `screenshot-${timestamp}.png`;
  const filepath = path.join(targetDir, filename);
  const { fullPage = false, selector, thumbnail = false, autoOcr = false } = args;

  // Take screenshot
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

  let resultText = `Screenshot saved to: ${filepath}`;
  let thumbnailPath: string | undefined;
  let ocrText: string | undefined;

  // Generate thumbnail if requested
  if (thumbnail) {
    try {
      thumbnailPath = await createThumbnail(filepath);
      resultText += `\nThumbnail saved to: ${thumbnailPath}`;
    } catch (error) {
      console.error('Error creating thumbnail:', error);
      resultText += '\nFailed to create thumbnail';
    }
  }

  // Perform OCR if requested
  if (autoOcr) {
    try {
      const worker = await initOCR();
      const targetPath = thumbnailPath || filepath;
      const { data: { text } } = await worker.recognize(targetPath);
      ocrText = text;
      resultText += `\n\nExtracted text:\n${text}`;
    } catch (error) {
      console.error('Error performing OCR:', error);
      resultText += '\nFailed to perform OCR';
    }
  }

  // Run cleanup (async, don't wait for it)
  cleanupOldScreenshots(targetDir).then(({ deleted, kept }) => {
    if (deleted > 0) {
      console.log(`Cleaned up ${deleted} old screenshot(s), kept ${kept}`);
    }
  }).catch(error => {
    console.error('Error during auto-cleanup:', error);
  });

  return {
    content: [{
      type: 'text',
      text: resultText
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
        ? `Screenshots in ${SCREENSHOT_DIR}:\n${imageFiles.join('\n')}`
        : `No screenshots found in ${SCREENSHOT_DIR}`
    }]
  };
}

export { SCREENSHOT_DIR };
