# Claude Code Configuration for web-agent-mcp

## Git Workflow

When committing changes to this repository, always push to GitHub automatically after the commit succeeds.

## TeamDynamix Login

### CANARY Environment ONLY

**Important**: These credentials are ONLY for the TeamDynamix **CANARY** environment (eng.teamdynamixcanary.com). Do NOT use for development or production environments.

### Credentials (CANARY)
- **Environment**: CANARY (eng.teamdynamixcanary.com)
- **Username**: `bheard`
- **Password (DPAPI)**: `dpapi:AQAAANCMnd8BFdERjHoAwE/Cl+sBAAAAqJA/rcsAEUK/lo7/r55ijgAAAAACAAAAAAAQZgAAAAEAACAAAAB8xPFjXo6R+0clqgDWQwughwA3Hv37b578v2wGEkG/BwAAAAAOgAAAAAIAACAAAABIGMfezTdPSVjFjkU7OgVuJd7xBvm6oJAFzVAmLHre7BAAAABRAqatX6hBmHdRnR8F8pblQAAAAI26jPBfqrDOp4RhuNWnsnjlCoXCyvFsIPbORHkLr3EgH9W3x2bdcSHbJeEBFL9fLCZ6dV3DGAzqQ294474oC60=`

### Login Process
1. Navigate to any protected TeamDynamix page (it will redirect to login if needed)
2. Use these selectors to fill the form:
   - Username field: `#txtUserName`
   - Password field: `#txtPassword`
   - Submit button: `#btnSignIn`
3. Wait 5 seconds after clicking submit for the page to load

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

### Decrypting Passwords

To decrypt a DPAPI-encrypted password when needed:

```powershell
# Decrypt password inline (for tool parameters)
powershell -Command "Add-Type -AssemblyName System.Security; [Text.Encoding]::UTF8.GetString([Security.Cryptography.ProtectedData]::Unprotect([Convert]::FromBase64String('ENCRYPTED_STRING_WITHOUT_dpapi_PREFIX'), $null, 'CurrentUser'))"
```

**Example login workflow for any environment:**
```javascript
// Method 1: Decrypt and use the login tool
// First decrypt the password from the credential file using the PowerShell command above
// Then use it directly in the login tool

await mcp__web-agent-mcp__login({
  usernameSelector: '#txtUserName',
  passwordSelector: '#txtPassword',
  username: 'bheard',
  password: 'DECRYPTED_PASSWORD_HERE',  // Use the decrypted result
  submitSelector: '#btnSignIn'
});

// Method 2: Decrypt and type into fields
await mcp__web-agent-mcp__type({ selector: '#txtUserName', text: 'bheard' });
await mcp__web-agent-mcp__type({
  selector: '#txtPassword',
  text: 'DECRYPTED_PASSWORD_HERE'  // Use the decrypted result
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
- **Production/Development**: Use credentials stored in `C:\Users\ben.heard\.config\tdx\prod-credentials.json` and `C:\Users\ben.heard\.config\tdx\dev-credentials.json`
- **Credentials File Format**: All passwords use **DPAPI encryption** with `dpapi:` prefix
- **Security Policy**: **NEVER output decoded passwords to screen or in tool results**
- **NEVER mix environments**: CANARY credentials will NOT work on prod/dev and vice versa

## TeamDynamix Development Codebase

### Main Repository Location
- **Path**: `C:\source\TDDev\enterprise`
- This is the primary codebase for TeamDynamix development work
- Contains information about the current branch being worked on

### Local Development Environment
- **URL**: `http://localhost/TDDev/TDWorkManagement`
- This is the local development environment for testing changes
- **Credentials**: `C:\Users\ben.heard\.config\tdx\dev-credentials.json`

## Console Log Capture

The web-agent-mcp server now supports capturing browser console logs from JavaScript execution. This is particularly useful for debugging front-end code.

### get_console_logs Tool

**Purpose**: Retrieve console messages (console.log, console.warn, console.error, etc.) from the browser.

**Parameters**:
- `clear` (optional, boolean): Clear the console log buffer after reading (default: false)
- `filter` (optional, string): Filter messages by type (log, warn, error, info, debug) or by text content

**Usage Example**:
```javascript
// Get all console logs
await mcp__web-agent-mcp__get_console_logs({});

// Get only error messages
await mcp__web-agent-mcp__get_console_logs({ filter: 'error' });

// Get logs and clear the buffer
await mcp__web-agent-mcp__get_console_logs({ clear: true });

// Search for specific text in logs
await mcp__web-agent-mcp__get_console_logs({ filter: 'DatePicker' });
```

**Notes**:
- Console messages are captured automatically from the moment the page loads
- Messages include timestamp, type (log/warn/error/info/debug), text content, and source location
- The buffer persists across page interactions until explicitly cleared or the browser session ends
- Useful for debugging Vue components, event handlers, and other JavaScript code

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
