import { initBrowser } from '../browser.js';
import { NavigateArgs, ToolResult } from '../types.js';

export async function handleNavigate(args: NavigateArgs): Promise<ToolResult> {
  const page = await initBrowser();
  const { url, waitUntil = 'load' } = args;

  const response = await page.goto(url, {
    waitUntil,
    timeout: 60000
  });

  return {
    content: [{
      type: 'text',
      text: `Navigated to ${url}. Status: ${response?.status()}`
    }]
  };
}

export async function handleGoBack(): Promise<ToolResult> {
  const page = await initBrowser();
  await page.goBack();
  return {
    content: [{
      type: 'text',
      text: 'Navigated back in history'
    }]
  };
}

export async function handleGoForward(): Promise<ToolResult> {
  const page = await initBrowser();
  await page.goForward();
  return {
    content: [{
      type: 'text',
      text: 'Navigated forward in history'
    }]
  };
}

export async function handleRefresh(): Promise<ToolResult> {
  const page = await initBrowser();
  await page.reload();
  return {
    content: [{
      type: 'text',
      text: 'Page refreshed'
    }]
  };
}
