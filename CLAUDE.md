# Claude Code Configuration for web-agent-mcp

## Git Workflow

When committing changes to this repository, always push to GitHub automatically after the commit succeeds.

## AI Assistant Usage Guidelines

### Context-Efficient Screenshot Practices

**IMPORTANT**: Follow these guidelines when taking screenshots to minimize context token usage:

#### Default Behavior (Automatic)
- Screenshots save ONLY 800px lowRes by default (saves ~50-60% context tokens & disk space)
- High resolution images are NOT saved unless you specify `hiRes: true`
- Filename is exactly what you specify (no suffix added)

#### When to Use Each Feature

**Default: Just take the screenshot** (lowRes only, most common)
- Use for: Visual verification, checking layouts, confirming page state
- Example: `screenshot({ filename: 'page.png' })`
- Result: Saves `page.png` (800px lowRes)
- **This is what you should do 90% of the time**

**Use `hiRes: true` ONLY when:**
- Fine visual details are critical (design review, pixel-perfect verification)
- 800px lowRes is insufficient for the task
- User explicitly requests full resolution
- Example: `screenshot({ filename: 'detailed.png', hiRes: true })`
- Result: Saves `detailed.png` (full resolution, NO lowRes version)
- **Rarely needed - ask yourself if you really need this**

#### Workflow Example

```javascript
// MOST COMMON: Just take screenshot (800px lowRes)
await screenshot({ filename: 'login-page.png' });
// Saves: login-page.png (800px lowRes)

// RARE: Only if you absolutely need high resolution
await screenshot({ filename: 'design.png', hiRes: true });
// Saves: design.png (full resolution ONLY, no lowRes)
```

#### What NOT to Do

❌ **Don't request hiRes unnecessarily**
```javascript
await screenshot({ filename: 'page.png', hiRes: true });  // WHY?
```

✅ **Do use the simplest approach**
```javascript
// Default: Just take it (800px lowRes)
await screenshot({ filename: 'page.png' });
```

## TeamDynamix Login

### CANARY Environment ONLY

**Important**: These credentials are ONLY for the TeamDynamix **CANARY** environment (eng.teamdynamixcanary.com). Do NOT use for development or production environments.

### Credentials (CANARY)
- **Environment**: CANARY (eng.teamdynamixcanary.com)
- **Base URL**: `https://eng.teamdynamixcanary.com/`
- **Login Paths**: You can sign into any of these:
  - `/TDNext` - Next-gen interface
  - `/TDClient` - Client interface
  - `/TDAdmin` - Admin interface
- **Username**: `bheard`
- **Password (DPAPI)**: `dpapi:AQAAANCMnd8BFdERjHoAwE/Cl+sBAAAAqJA/rcsAEUK/lo7/r55ijgAAAAACAAAAAAAQZgAAAAEAACAAAAB8xPFjXo6R+0clqgDWQwughwA3Hv37b578v2wGEkG/BwAAAAAOgAAAAAIAACAAAABIGMfezTdPSVjFjkU7OgVuJd7xBvm6oJAFzVAmLHre7BAAAABRAqatX6hBmHdRnR8F8pblQAAAAI26jPBfqrDOp4RhuNWnsnjlCoXCyvFsIPbORHkLr3EgH9W3x2bdcSHbJeEBFL9fLCZ6dV3DGAzqQ294474oC60=`

### Login Process
1. Navigate to base URL or any protected TeamDynamix page (it will redirect to login if needed)
2. **Note**: If already authenticated, the page will load directly without showing a login form
3. If login form appears, use these selectors:
   - Username field: `#txtUserName`
   - Password field: `#txtPassword`
   - Submit button: `#btnSignIn`
4. Wait 5 seconds after clicking submit for the page to load

### Security Warning: Password Visibility

**CRITICAL SECURITY RULE**:
- **NEVER output decoded passwords in tool results or descriptions**
- **NEVER use Bash tool to decode passwords** - this displays the password on screen
- Passwords are encrypted with **Windows DPAPI** - they cannot be decrypted without your Windows user account
- Even if someone screenshots the credential files, they are useless without access to your Windows account

### Password Encryption: Windows DPAPI

All passwords in credential files use **Windows Data Protection API (DPAPI)** encryption with the `dpapi:` prefix. This provides:
- Strong encryption tied to your Windows user account
- No separate key file needed
- Automatic protection against unauthorized access
- Cannot be decrypted by anyone else, even with file access

### Using DPAPI-Encrypted Passwords

**CRITICAL**: The `mcp__web-agent-mcp__login` and `mcp__web-agent-mcp__type` tools accept `dpapi:` encrypted passwords directly. **NEVER manually decrypt passwords** - always pass the full `dpapi:` string to the tools.

**Example login workflow for any environment:**
```javascript
// Method 1: Use the login tool with dpapi: password directly
await mcp__web-agent-mcp__login({
  usernameSelector: '#txtUserName',
  passwordSelector: '#txtPassword',
  username: 'bheard',
  password: 'dpapi:AQAAANCMnd8BFdERjHoAwE/Cl+sBAAAA...',  // Pass the full dpapi: string
  submitSelector: '#btnSignIn'
});

// Method 2: Type into fields with dpapi: password directly
await mcp__web-agent-mcp__type({ selector: '#txtUserName', text: 'bheard' });
await mcp__web-agent-mcp__type({
  selector: '#txtPassword',
  text: 'dpapi:AQAAANCMnd8BFdERjHoAwE/Cl+sBAAAA...'  // Pass the full dpapi: string
});
await mcp__web-agent-mcp__click({ selector: '#btnSignIn' });
await mcp__web-agent-mcp__wait({ timeout: 5000 });
```

### Encrypting New Passwords

To encrypt a new password for credential files:

```powershell
# Encrypt a password
powershell -Command "Add-Type -AssemblyName System.Security; 'dpapi:' + [Convert]::ToBase64String([Security.Cryptography.ProtectedData]::Protect([Text.Encoding]::UTF8.GetBytes('YOUR_PASSWORD'), $null, 'CurrentUser'))"
```

### Other Environments
- **Production/Development**: Use credentials stored in `C:\Users\ben.heard\.config\tdx-mcp\prod-credentials.json` and `C:\Users\ben.heard\.config\tdx-mcp\dev-credentials.json`
- **Credentials File Format**: All passwords use **DPAPI encryption** with `dpapi:` prefix
- **Security Policy**: **NEVER output decoded passwords to screen or in tool results**
- **NEVER mix environments**: CANARY credentials will NOT work on prod/dev and vice versa

## TeamDynamix Development Codebases

There are two local development environments available:

### TDDev (Primary)
- **Repository Path**: `C:\source\TDDev\enterprise`
- **Base URL**: `http://localhost/TDDev/`
- **Login Paths**:
  - `/TDDev/TDNext` - Next-gen interface
  - `/TDDev/TDClient` - Client interface
  - `/TDDev/TDAdmin` - Admin interface
  - `/TDDev/TDWorkManagement` - Work Management interface
- **Credentials**: Stored in `C:\Users\ben.heard\.config\tdx-mcp\dev-credentials.json`

### TDDM (Secondary)
- **Repository Path**: `C:\source\TDDM\enterprise`
- **Base URL**: `http://localhost/TDDM/`
- **Login Paths**:
  - `/TDDM/TDNext` - Next-gen interface
  - `/TDDM/TDClient` - Client interface
  - `/TDDM/TDAdmin` - Admin interface
  - `/TDDM/TDWorkManagement` - Work Management interface
- **Credentials**: Same as TDDev - stored in `C:\Users\ben.heard\.config\tdx-mcp\dev-credentials.json`

### Login Process (Both Environments)
Same as Canary - navigate to any path and use the login form with dev credentials:
- Username field: `#txtUserName`
- Password field: `#txtPassword`
- Submit button: `#btnSignIn`

## Console Tools

The web-agent-mcp server supports both capturing and executing JavaScript in the browser console. This is particularly useful for debugging front-end code.

### get_console_logs Tool

**Purpose**: Retrieve console messages (console.log, console.warn, console.error, etc.) from the browser.

**Parameters**:
- `clear` (optional, boolean): Clear the console log buffer after reading (default: false)
- `filter` (optional, string): Filter messages by type (log, warn, error, info, debug) or by text content
- `limit` (optional, number): Max messages to return (default: 50, use 0 for all)

**Usage Example**:
```javascript
// Get last 50 console logs (default, saves context)
await mcp__web-agent-mcp__get_console_logs({});

// Get only error messages (last 50 errors)
await mcp__web-agent-mcp__get_console_logs({ filter: 'error' });

// Get last 10 messages only
await mcp__web-agent-mcp__get_console_logs({ limit: 10 });

// Get ALL logs (use sparingly, can be huge)
await mcp__web-agent-mcp__get_console_logs({ limit: 0 });

// Search for specific text in logs
await mcp__web-agent-mcp__get_console_logs({ filter: 'DatePicker', limit: 20 });
```

**Notes**:
- **Default returns only 50 most recent messages to save context**
- Console messages are captured automatically from the moment the page loads
- Messages include timestamp, type (log/warn/error/info/debug), text content, and source location
- The buffer persists across page interactions until explicitly cleared or the browser session ends
- Use `limit` parameter to control context usage (lower = less context)
- Useful for debugging Vue components, event handlers, and other JavaScript code

### execute_console Tool

**Purpose**: Execute JavaScript code in the browser console and return the result.

**Parameters**:
- `code` (required, string): JavaScript code to execute in the browser context

**Usage Example**:
```javascript
// Execute basic JavaScript
await mcp__web-agent-mcp__execute_console({ code: '2 + 2' });

// Query the DOM
await mcp__web-agent-mcp__execute_console({
  code: 'document.querySelector("h1").textContent'
});

// Execute complex code with console logging
await mcp__web-agent-mcp__execute_console({
  code: 'console.log("Debug info"); someFunction(); "done"'
});

// Manipulate the page
await mcp__web-agent-mcp__execute_console({
  code: 'document.body.style.backgroundColor = "red"; "Color changed"'
});
```

**Notes**:
- Code executes in the current page context with full access to the DOM and global scope
- The last expression in the code is returned as the result
- Do not use `return` statements (causes "Illegal return statement" error)
- Console output from the executed code is captured and available via `get_console_logs`
- Useful for debugging, testing, and dynamically manipulating pages

## Web Navigation Workflow

### Single Action Instructions
When the user provides a **specific single navigation/interaction instruction** (e.g., "click this button", "navigate to this URL", "take a screenshot"), complete ONLY that action and then **STOP and await further instructions**.

Examples of single actions:
- "Navigate to [URL]"
- "Click [element]"
- "Type [text] into [field]"
- "Take a screenshot"
- "Scroll down"

### Multi-Step Task Instructions
When the user provides a **higher-level task** (e.g., "test the login flow", "find and fill out the form"), you may proceed with multiple actions to complete the entire task without stopping after each step.

Examples of multi-step tasks:
- "Log in to the application"
- "Test the date picker tab navigation"
- "Find a form with date fields and fill it out"

## Screenshots

### Screenshot Location
- **Default Path**: `./screenshots/` (relative to MCP server installation directory)
- By default, screenshots are saved to the `screenshots/` directory within the web-agent-mcp installation
- Screenshots are named with timestamps (e.g., `screenshot-2025-11-21T22-12-57-732Z.png`)
- Custom filenames can be specified when taking screenshots
- The tool always displays the full absolute path when a screenshot is taken
- Use `mcp__web-agent-mcp__list_screenshots` to see all available screenshots and their location
- Screenshots are automatically excluded from git (configured in `.gitignore`)

### Custom Screenshot Directory
- **Parameter**: `directory` (optional, string) - Absolute path to save screenshots
- When specified, screenshots will be saved to the custom directory instead of the default location
- The directory will be created automatically if it doesn't exist
- Useful when working with MCP from a different project and wanting screenshots in that project's directory

### Context-Efficient Screenshot Features

**LowRes Only by Default** (Saves Context Tokens & Disk Space)
- Screenshots save **ONLY** 800px lowRes by default
- No high resolution image is saved unless explicitly requested
- Filename is exactly what you specify (e.g., `page.png`)
- **Benefit**: Saves ~50-60% context tokens AND disk space
- Use `hiRes: true` only when full details are absolutely required

**Automatic Cleanup** (Prevents Accumulation)
- Runs automatically after each screenshot
- **Strategy**: Hybrid time + count based
  - Deletes screenshots older than 7 days
  - Always keeps the 10 most recent screenshots
- Deletes both full screenshots and their thumbnails
- **Benefit**: Prevents screenshot directory from growing indefinitely

### Screenshot Usage Examples

**Example 1 - Basic screenshot (lowRes only, default):**
```javascript
await mcp__web-agent-mcp__screenshot({
  filename: 'login-page.png'
});
// Saves: login-page.png (800px lowRes)
```

**Example 2 - High resolution (rarely needed):**
```javascript
await mcp__web-agent-mcp__screenshot({
  filename: 'design-review.png',
  hiRes: true
});
// Saves: design-review.png (full resolution ONLY)
```

**Example 3 - Full-page screenshot with custom directory:**
```javascript
await mcp__web-agent-mcp__screenshot({
  filename: 'full-page.png',
  fullPage: true,
  directory: 'E:\\MyProject\\screenshots'
});
// Saves: E:\MyProject\screenshots\full-page.png (800px lowRes)
```

## Testing

### Running Tests

The MCP server includes comprehensive automated tests for all tools. To run the test suite:

```bash
npm test
```

This will:
1. Build the TypeScript source code
2. Start the MCP server
3. Run all tool tests via JSON-RPC
4. Display results with pass/fail status

### Test Coverage

The test suite (`test-all-tools.mjs`) includes tests for:

- **Meta Tests**: Tool listing and resource verification
- **Navigation Tests**: URL navigation, page content retrieval, refresh
- **Interaction Tests**: Element queries, scrolling, waiting for selectors
- **Screenshot Tests**: Taking and listing screenshots
- **Debugging Tests**: Console log capture, filtering, and clearing
- **Console Execution Tests**: JavaScript execution, DOM queries, console log generation
- **Cookie Tests**: Setting and retrieving cookies
- **Keyboard Tests**: Key press simulation

### Test Results

A typical successful test run shows:
- Total tests: 40+ tests
- Pass rate: 100%
- All tools verified as working correctly

### Adding New Tests

When adding new tools or features:
1. Add the tool name to the `expectedTools` array in the Meta Tests section
2. Create a new test function following the existing pattern
3. Add the test function to `runAllTests()`
4. Ensure the test covers both success and error cases
