import { initBrowser, getContext } from '../browser.js';
import { LoginArgs, GetCookiesArgs, SetCookieArgs, ToolResult } from '../types.js';
import { execSync } from 'child_process';

/**
 * Decode password if it has base64: or dpapi: prefix
 */
function decodePassword(password: string): string {
  if (password.startsWith('base64:')) {
    const base64Value = password.substring(7); // Remove 'base64:' prefix
    return Buffer.from(base64Value, 'base64').toString('utf-8');
  }
  if (password.startsWith('dpapi:')) {
    const encryptedPassword = password.substring(6); // Remove 'dpapi:' prefix
    const psCommand = `Add-Type -AssemblyName System.Security; $encrypted = [Convert]::FromBase64String('${encryptedPassword}'); $decrypted = [Security.Cryptography.ProtectedData]::Unprotect($encrypted, $null, 'CurrentUser'); [Text.Encoding]::UTF8.GetString($decrypted)`;
    return execSync(`powershell -NoProfile -NonInteractive -Command "${psCommand}"`, { encoding: 'utf8', windowsHide: true } as any).trim();
  }
  return password;
}

export async function handleLogin(args: LoginArgs): Promise<ToolResult> {
  const page = await initBrowser();
  const { usernameSelector, passwordSelector, username, password, submitSelector } = args;

  // Decode password if base64-encoded
  const decodedPassword = decodePassword(password);

  // Fill username
  await page.fill(usernameSelector, username);

  // Fill password
  await page.fill(passwordSelector, decodedPassword);

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
