import { initBrowser } from '../browser.js';
import { ScreenshotArgs, ToolResult } from '../types.js';
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
const MAX_SCREENSHOT_AGE_DAYS = 7; // Delete screenshots older than 7 days
const MIN_SCREENSHOTS_TO_KEEP = 10; // Always keep at least this many recent screenshots
const LOW_RES_WIDTH = 800; // Low resolution screenshot width in pixels

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
 * Create a low resolution version of a screenshot
 */
async function createLowRes(sourcePath: string, targetPath: string): Promise<void> {
  await sharp(sourcePath)
    .resize(LOW_RES_WIDTH, null, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .toFile(targetPath);
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
      (f.endsWith('.png') || f.endsWith('.jpg')) && !f.startsWith('temp-')
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

    // Delete old files
    let deletedCount = 0;
    for (const file of toDelete) {
      try {
        await fs.unlink(file.filepath);
        deletedCount++;
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
  const finalPath = path.join(targetDir, filename);
  const { fullPage = false, selector, hiRes = false } = args;

  let resultText = '';

  if (hiRes) {
    // High resolution: Save full screenshot directly
    if (selector) {
      const element = await page.$(selector);
      if (element) {
        await element.screenshot({ path: finalPath });
      } else {
        throw new Error(`Element not found: ${selector}`);
      }
    } else {
      await page.screenshot({
        path: finalPath,
        fullPage
      });
    }
    resultText = `Screenshot saved (hiRes): ${finalPath}`;
  } else {
    // Low resolution (default): Capture full, resize to 800px, save as lowRes
    const tempFullPath = path.join(targetDir, `temp-${filename}`);

    // Take full screenshot to temporary location
    if (selector) {
      const element = await page.$(selector);
      if (element) {
        await element.screenshot({ path: tempFullPath });
      } else {
        throw new Error(`Element not found: ${selector}`);
      }
    } else {
      await page.screenshot({
        path: tempFullPath,
        fullPage
      });
    }

    // Create low resolution version
    try {
      await createLowRes(tempFullPath, finalPath);
      resultText = `Screenshot saved (lowRes 800px): ${finalPath}`;
    } catch (error) {
      console.error('Error creating low resolution screenshot:', error);
      throw new Error('Failed to create low resolution screenshot');
    }

    // Delete temp full screenshot
    try {
      await fs.unlink(tempFullPath);
    } catch (error) {
      console.error('Error deleting temp screenshot:', error);
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
