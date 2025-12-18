import { initBrowser, setCurrentFrame, getCurrentFrame, clearCurrentFrame } from '../browser.js';
import { SwitchToIframeArgs, ToolResult } from '../types.js';

export async function handleSwitchToIframe(args: SwitchToIframeArgs): Promise<ToolResult> {
  const page = await initBrowser();
  const { selector, name, index } = args;

  try {
    let frame;

    if (index !== undefined) {
      // Switch by index
      const frames = page.frames();
      if (index < 0 || index >= frames.length) {
        throw new Error(`Frame index ${index} out of range (0-${frames.length - 1})`);
      }
      frame = frames[index];
    } else if (selector) {
      // Switch by CSS selector
      const frameElement = await page.$(selector);
      if (!frameElement) {
        throw new Error(`No iframe found with selector: ${selector}`);
      }
      frame = await frameElement.contentFrame();
      if (!frame) {
        throw new Error(`Element with selector ${selector} is not an iframe`);
      }
    } else if (name) {
      // Switch by name attribute
      frame = page.frames().find(f => f.name() === name);
      if (!frame) {
        throw new Error(`No iframe found with name: ${name}`);
      }
    } else {
      throw new Error('Must provide selector, name, or index parameter');
    }

    setCurrentFrame(frame);

    const frameUrl = frame.url();
    const frameName = frame.name();

    return {
      content: [{
        type: 'text',
        text: `Switched to iframe: ${frameName || 'unnamed'}\nURL: ${frameUrl}`
      }]
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `Failed to switch to iframe: ${error.message}`
      }],
      isError: true
    };
  }
}

export async function handleSwitchToMainContent(): Promise<ToolResult> {
  clearCurrentFrame();

  return {
    content: [{
      type: 'text',
      text: 'Switched to main page content'
    }]
  };
}

export async function handleListIframes(): Promise<ToolResult> {
  const page = await initBrowser();

  try {
    const frames = page.frames();
    const mainFrame = page.mainFrame();

    // Filter out the main frame, only show iframes
    const iframes = frames.filter(f => f !== mainFrame);

    if (iframes.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No iframes found on the page'
        }]
      };
    }

    const frameInfo = iframes.map((frame, index) => ({
      index,
      name: frame.name() || '(unnamed)',
      url: frame.url()
    }));

    return {
      content: [{
        type: 'text',
        text: `Found ${iframes.length} iframe(s):\n\n${JSON.stringify(frameInfo, null, 2)}`
      }]
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `Failed to list iframes: ${error.message}`
      }],
      isError: true
    };
  }
}

export async function handleGetCurrentFrame(): Promise<ToolResult> {
  const currentFrame = getCurrentFrame();

  if (!currentFrame) {
    return {
      content: [{
        type: 'text',
        text: 'Current context: main page content'
      }]
    };
  }

  try {
    const frameUrl = currentFrame.url();
    const frameName = currentFrame.name();

    return {
      content: [{
        type: 'text',
        text: `Current context: iframe\nName: ${frameName || '(unnamed)'}\nURL: ${frameUrl}`
      }]
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `Error getting current frame info: ${error.message}`
      }],
      isError: true
    };
  }
}
