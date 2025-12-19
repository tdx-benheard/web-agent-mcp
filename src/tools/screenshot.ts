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
const MAX_SCREENSHOTS_TO_KEEP = 20; // Delete oldest when over this limit
const LOW_RES_WIDTH = 800; // Low resolution screenshot width in pixels
const JPEG_QUALITY = 75; // JPEG quality (1-100)

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
    .jpeg({ quality: JPEG_QUALITY })
    .toFile(targetPath);
}

/**
 * Cleanup old screenshots - keep only the most recent MAX_SCREENSHOTS_TO_KEEP
 */
async function cleanupOldScreenshots(targetDir: string = SCREENSHOT_DIR): Promise<{ deleted: number, kept: number }> {
  try {
    const files = await fs.readdir(targetDir);
    const imageFiles = files.filter(f =>
      (f.endsWith('.png') || f.endsWith('.jpg')) && !f.startsWith('temp-')
    );

    if (imageFiles.length <= MAX_SCREENSHOTS_TO_KEEP) {
      return { deleted: 0, kept: imageFiles.length };
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

    // Delete everything beyond the limit
    const toDelete = fileStats.slice(MAX_SCREENSHOTS_TO_KEEP);

    let deletedCount = 0;
    for (const file of toDelete) {
      try {
        await fs.unlink(file.filepath);
        deletedCount++;
      } catch (error) {
        console.error(`Error deleting ${file.filename}:`, error);
      }
    }

    return { deleted: deletedCount, kept: MAX_SCREENSHOTS_TO_KEEP };
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
  const filename = args.filename || `screenshot-${timestamp}.jpg`;
  const finalPath = path.join(targetDir, filename);
  const { fullPage = false, selector, hiRes = false } = args;

  let resultText = '';

  if (hiRes) {
    // High resolution: Save full screenshot, convert to JPEG
    const tempFullPath = path.join(targetDir, `temp-hires-${filename}`);

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

    // Convert to JPEG (higher quality for hiRes)
    try {
      await sharp(tempFullPath)
        .jpeg({ quality: 85 })
        .toFile(finalPath);
    } catch (error) {
      console.error('Error converting to JPEG:', error);
      throw new Error('Failed to convert screenshot to JPEG');
    }

    // Delete temp file
    try {
      await fs.unlink(tempFullPath);
    } catch (error) {
      console.error('Error deleting temp screenshot:', error);
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
      resultText = `Screenshot saved (800px JPEG): ${finalPath}`;
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
