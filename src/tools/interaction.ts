import { initBrowser } from '../browser.js';
import { ClickArgs, TypeArgs, PressKeyArgs, ScrollArgs, WaitArgs, ToolResult } from '../types.js';

export async function handleClick(args: ClickArgs): Promise<ToolResult> {
  const page = await initBrowser();
  const { selector, clickCount = 1, button = 'left' } = args;

  // Try to click by text first, then by selector
  try {
    await page.click(`text="${selector}"`, {
      clickCount,
      button,
      timeout: 5000
    });
  } catch {
    await page.click(selector, {
      clickCount,
      button
    });
  }

  return {
    content: [{
      type: 'text',
      text: `Clicked on element: ${selector}`
    }]
  };
}

export async function handleType(args: TypeArgs): Promise<ToolResult> {
  const page = await initBrowser();
  const { selector, text, delay = 0 } = args;

  await page.fill(selector, text);

  if (delay > 0) {
    await page.type(selector, text, { delay });
  }

  return {
    content: [{
      type: 'text',
      text: `Typed text into ${selector}`
    }]
  };
}

export async function handlePressKey(args: PressKeyArgs): Promise<ToolResult> {
  const page = await initBrowser();
  const { key, delay = 0 } = args;

  if (delay > 0) {
    await page.waitForTimeout(delay);
  }

  // Check if it's a key combination (e.g., "Control+C")
  if (key.includes('+')) {
    const keys = key.split('+');
    const modifiers = keys.slice(0, -1);
    const mainKey = keys[keys.length - 1];

    // Press modifiers
    for (const modifier of modifiers) {
      await page.keyboard.down(modifier);
    }

    // Press main key
    await page.keyboard.press(mainKey);

    // Release modifiers in reverse order
    for (let i = modifiers.length - 1; i >= 0; i--) {
      await page.keyboard.up(modifiers[i]);
    }

    return {
      content: [{
        type: 'text',
        text: `Pressed key combination: ${key}`
      }]
    };
  } else {
    // Single key press
    await page.keyboard.press(key);

    return {
      content: [{
        type: 'text',
        text: `Pressed key: ${key}`
      }]
    };
  }
}

export async function handleScroll(args: ScrollArgs): Promise<ToolResult> {
  const page = await initBrowser();
  const { direction = 'down', amount = 500 } = args;

  let scrollCode = '';
  switch (direction) {
    case 'up':
      scrollCode = `window.scrollBy(0, -${amount})`;
      break;
    case 'down':
      scrollCode = `window.scrollBy(0, ${amount})`;
      break;
    case 'left':
      scrollCode = `window.scrollBy(-${amount}, 0)`;
      break;
    case 'right':
      scrollCode = `window.scrollBy(${amount}, 0)`;
      break;
    default:
      scrollCode = `window.scrollBy(0, ${amount})`;
  }

  await page.evaluate(scrollCode);

  return {
    content: [{
      type: 'text',
      text: `Scrolled ${direction} by ${amount}px`
    }]
  };
}

export async function handleWait(args: WaitArgs): Promise<ToolResult> {
  const page = await initBrowser();
  const { selector, timeout = 14000, state = 'visible' } = args;

  if (selector) {
    await page.waitForSelector(selector, {
      timeout,
      state
    });

    return {
      content: [{
        type: 'text',
        text: `Element ${selector} is now ${state}`
      }]
    };
  }

  // If no selector, just wait
  await page.waitForTimeout(timeout);
  return {
    content: [{
      type: 'text',
      text: `Waited for ${timeout}ms`
    }]
  };
}
