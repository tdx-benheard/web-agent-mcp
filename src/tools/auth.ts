import { initBrowser, getContext } from '../browser.js';
import { LoginArgs, GetCookiesArgs, SetCookieArgs, ToolResult } from '../types.js';

export async function handleLogin(args: LoginArgs): Promise<ToolResult> {
  const page = await initBrowser();
  const { usernameSelector, passwordSelector, username, password, submitSelector } = args;

  // Fill username
  await page.fill(usernameSelector, username);

  // Fill password
  await page.fill(passwordSelector, password);

  // Click submit
  await page.click(submitSelector);

  // Wait for navigation
  await page.waitForLoadState('networkidle', { timeout: 14000 });

  return {
    content: [{
      type: 'text',
      text: 'Login completed successfully'
    }]
  };
}

export async function handleGetCookies(args: GetCookiesArgs): Promise<ToolResult> {
  const context = getContext();
  if (!context) {
    await initBrowser();
  }

  const cookies = await getContext()!.cookies(args.urls);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(cookies, null, 2)
    }]
  };
}

export async function handleSetCookie(args: SetCookieArgs): Promise<ToolResult> {
  const context = getContext();
  if (!context) {
    await initBrowser();
  }

  const { name, value, domain, path = '/' } = args;

  await getContext()!.addCookies([{
    name,
    value,
    domain,
    path
  }]);

  return {
    content: [{
      type: 'text',
      text: `Cookie ${name} set successfully`
    }]
  };
}
