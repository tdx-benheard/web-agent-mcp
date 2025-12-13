// Comprehensive Test Suite for Web Agent MCP Server
// Tests all tools including the new console log capture feature

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Web Agent MCP Server - Comprehensive Test Suite\n');
console.log('='.repeat(60));

let server;
let testResults = [];
let requestId = 1;

// Test tracking
function recordTest(name, passed, message) {
  testResults.push({ name, passed, message });
  const icon = passed ? '✓' : '✗';
  const color = passed ? '\x1b[32m' : '\x1b[31m';
  console.log(`${color}${icon}\x1b[0m ${name}${message ? `: ${message}` : ''}`);
}

// Start the server
async function startServer() {
  return new Promise((resolve, reject) => {
    const serverPath = path.join(__dirname, 'dist', 'index.js');
    server = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let responseBuffer = '';

    server.stdout.on('data', (data) => {
      responseBuffer += data.toString();
      // Try to parse complete JSON-RPC messages
      const lines = responseBuffer.split('\n');
      responseBuffer = lines.pop(); // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.trim()) {
          try {
            const json = JSON.parse(line);
            server.emit('jsonrpc-response', json);
          } catch (e) {
            // Not JSON, ignore
          }
        }
      }
    });

    server.stderr.on('data', (data) => {
      const error = data.toString();
      if (error.includes('Web Agent MCP Server running')) {
        console.log('✓ Server started successfully\n');
        resolve();
      }
    });

    server.on('error', reject);
    server.on('close', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`\n❌ Server exited unexpectedly with code ${code}`);
      }
    });
  });
}

// Send JSON-RPC request and wait for response
function sendRequest(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = requestId++;
    const request = {
      jsonrpc: '2.0',
      method,
      params,
      id
    };

    const timeout = setTimeout(() => {
      reject(new Error(`Request timed out: ${method}`));
    }, 30000); // 30 second timeout

    // Listen for response
    const responseHandler = (response) => {
      if (response.id === id) {
        clearTimeout(timeout);
        server.removeListener('jsonrpc-response', responseHandler);
        if (response.error) {
          reject(new Error(response.error.message || JSON.stringify(response.error)));
        } else {
          resolve(response.result);
        }
      }
    };

    server.on('jsonrpc-response', responseHandler);

    // Send request
    server.stdin.write(JSON.stringify(request) + '\n');
  });
}

// Test categories
async function testMeta() {
  console.log('\n📋 Meta Tests\n' + '-'.repeat(60));

  try {
    const tools = await sendRequest('tools/list');
    recordTest('List tools', tools && tools.tools && tools.tools.length > 0,
      `Found ${tools.tools.length} tools`);

    // Check for expected tools
    const toolNames = tools.tools.map(t => t.name);
    const expectedTools = [
      'navigate', 'click', 'type', 'login', 'screenshot', 'get_page_content',
      'wait', 'scroll', 'go_back', 'go_forward', 'refresh', 'get_cookies',
      'set_cookie', 'press_key', 'query_page', 'get_console_logs', 'execute_console'
    ];

    for (const tool of expectedTools) {
      recordTest(`Tool exists: ${tool}`, toolNames.includes(tool));
    }
  } catch (error) {
    recordTest('List tools', false, error.message);
  }

  try {
    const resources = await sendRequest('resources/list');
    recordTest('List resources', resources && resources.resources !== undefined);
  } catch (error) {
    recordTest('List resources', false, error.message);
  }
}

async function testNavigation() {
  console.log('\n🌐 Navigation Tests\n' + '-'.repeat(60));

  // Test navigate
  try {
    const result = await sendRequest('tools/call', {
      name: 'navigate',
      arguments: { url: 'https://example.com' }
    });
    recordTest('Navigate to URL', result && result.content && result.content[0].text.includes('example.com'));
  } catch (error) {
    recordTest('Navigate to URL', false, error.message);
  }

  // Test get_page_content
  try {
    const result = await sendRequest('tools/call', {
      name: 'get_page_content',
      arguments: { format: 'text' }
    });
    recordTest('Get page content (text)', result && result.content && result.content[0].text.includes('Example Domain'));
  } catch (error) {
    recordTest('Get page content (text)', false, error.message);
  }

  try {
    const result = await sendRequest('tools/call', {
      name: 'get_page_content',
      arguments: { format: 'html' }
    });
    recordTest('Get page content (HTML)', result && result.content && result.content[0].text.includes('<html'));
  } catch (error) {
    recordTest('Get page content (HTML)', false, error.message);
  }

  // Test refresh
  try {
    const result = await sendRequest('tools/call', {
      name: 'refresh',
      arguments: {}
    });
    recordTest('Refresh page', result && result.content);
  } catch (error) {
    recordTest('Refresh page', false, error.message);
  }
}

async function testInteraction() {
  console.log('\n🖱️  Interaction Tests\n' + '-'.repeat(60));

  // Navigate to a test page first
  await sendRequest('tools/call', {
    name: 'navigate',
    arguments: { url: 'https://example.com' }
  });

  // Test query_page
  try {
    const result = await sendRequest('tools/call', {
      name: 'query_page',
      arguments: {
        queries: [
          { name: 'heading', selector: 'h1', extract: 'text' },
          { name: 'all_paragraphs', selector: 'p', extract: 'text', all: true }
        ]
      }
    });
    recordTest('Query page elements', result && result.content && result.content[0].text.includes('Example Domain'));
  } catch (error) {
    recordTest('Query page elements', false, error.message);
  }

  // Test scroll
  try {
    const result = await sendRequest('tools/call', {
      name: 'scroll',
      arguments: { direction: 'down', amount: 100 }
    });
    recordTest('Scroll page', result && result.content);
  } catch (error) {
    recordTest('Scroll page', false, error.message);
  }

  // Test wait
  try {
    const result = await sendRequest('tools/call', {
      name: 'wait',
      arguments: { selector: 'body', timeout: 1000 }
    });
    recordTest('Wait for selector', result && result.content);
  } catch (error) {
    recordTest('Wait for selector', false, error.message);
  }
}

async function testScreenshots() {
  console.log('\n📸 Screenshot Tests\n' + '-'.repeat(60));

  // Test screenshot
  try {
    const result = await sendRequest('tools/call', {
      name: 'screenshot',
      arguments: { fullPage: false }
    });
    recordTest('Take screenshot', result && result.content && result.content[0].text.includes('Screenshot saved'));
  } catch (error) {
    recordTest('Take screenshot', false, error.message);
  }

  // Test list_screenshots
  try {
    const result = await sendRequest('tools/call', {
      name: 'list_screenshots',
      arguments: {}
    });
    recordTest('List screenshots', result && result.content);
  } catch (error) {
    recordTest('List screenshots', false, error.message);
  }
}

async function testDebugging() {
  console.log('\n🐛 Debugging Tests (Console Logs)\n' + '-'.repeat(60));

  // Navigate to a page and execute JavaScript to generate console logs
  try {
    await sendRequest('tools/call', {
      name: 'navigate',
      arguments: { url: 'data:text/html,<html><head><script>console.log("Test log");console.warn("Test warning");console.error("Test error");</script></head><body><h1>Console Test</h1></body></html>' }
    });

    // Wait a bit for console messages to be captured
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test get_console_logs
    const result = await sendRequest('tools/call', {
      name: 'get_console_logs',
      arguments: {}
    });

    const hasLogs = result && result.content && result.content[0].text !== 'No console messages found';
    recordTest('Get console logs', hasLogs,
      hasLogs ? 'Console messages captured' : 'No messages found');

    if (hasLogs) {
      const logText = result.content[0].text;
      recordTest('Console log contains "Test log"', logText.includes('Test log'));
      recordTest('Console log contains "Test warning"', logText.includes('Test warning'));
      recordTest('Console log contains "Test error"', logText.includes('Test error'));
    }

    // Test filtering
    const filteredResult = await sendRequest('tools/call', {
      name: 'get_console_logs',
      arguments: { filter: 'error' }
    });
    recordTest('Filter console logs by type',
      filteredResult && filteredResult.content && filteredResult.content[0].text.includes('error'));

    // Test clear
    await sendRequest('tools/call', {
      name: 'get_console_logs',
      arguments: { clear: true }
    });

    const afterClear = await sendRequest('tools/call', {
      name: 'get_console_logs',
      arguments: {}
    });
    recordTest('Clear console logs',
      afterClear && afterClear.content && afterClear.content[0].text === 'No console messages found');

  } catch (error) {
    recordTest('Console log capture', false, error.message);
  }
}

async function testConsoleExecution() {
  console.log('\n🔧 Console Execution Tests\n' + '-'.repeat(60));

  // Navigate to a simple page
  try {
    await sendRequest('tools/call', {
      name: 'navigate',
      arguments: { url: 'https://example.com' }
    });

    // Test execute_console - basic execution
    const execResult = await sendRequest('tools/call', {
      name: 'execute_console',
      arguments: { code: '2 + 2' }
    });
    recordTest('Execute console: basic arithmetic',
      execResult && execResult.content && execResult.content[0].text.includes('4'));

    // Test execute_console - DOM manipulation
    const domResult = await sendRequest('tools/call', {
      name: 'execute_console',
      arguments: { code: 'document.querySelector("h1").textContent' }
    });
    recordTest('Execute console: DOM query',
      domResult && domResult.content && domResult.content[0].text.includes('Example Domain'));

    // Test execute_console - generating console logs
    await sendRequest('tools/call', {
      name: 'execute_console',
      arguments: { code: 'console.log("Execute test"); "done"' }
    });

    // Verify the console log was captured
    const logsAfterExec = await sendRequest('tools/call', {
      name: 'get_console_logs',
      arguments: {}
    });
    recordTest('Execute console: generates console logs',
      logsAfterExec && logsAfterExec.content && logsAfterExec.content[0].text.includes('Execute test'));

  } catch (error) {
    recordTest('Console execution', false, error.message);
  }
}

async function testCookies() {
  console.log('\n🍪 Cookie Tests\n' + '-'.repeat(60));

  // Navigate to a real domain
  try {
    await sendRequest('tools/call', {
      name: 'navigate',
      arguments: { url: 'https://example.com' }
    });

    // Test set_cookie
    const setResult = await sendRequest('tools/call', {
      name: 'set_cookie',
      arguments: {
        name: 'test_cookie',
        value: 'test_value',
        domain: 'example.com'
      }
    });
    recordTest('Set cookie', setResult && setResult.content);

    // Test get_cookies
    const getResult = await sendRequest('tools/call', {
      name: 'get_cookies',
      arguments: {}
    });
    recordTest('Get cookies', getResult && getResult.content);
  } catch (error) {
    recordTest('Cookie operations', false, error.message);
  }
}

async function testKeyboard() {
  console.log('\n⌨️  Keyboard Tests\n' + '-'.repeat(60));

  // Test press_key
  try {
    const result = await sendRequest('tools/call', {
      name: 'press_key',
      arguments: { key: 'Tab' }
    });
    recordTest('Press key (Tab)', result && result.content);
  } catch (error) {
    recordTest('Press key (Tab)', false, error.message);
  }
}

// Run all tests
async function runAllTests() {
  try {
    await startServer();

    await testMeta();
    await testNavigation();
    await testInteraction();
    await testScreenshots();
    await testDebugging();
    await testConsoleExecution();
    await testCookies();
    await testKeyboard();

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary\n');

    const passed = testResults.filter(t => t.passed).length;
    const failed = testResults.filter(t => !t.passed).length;
    const total = testResults.length;

    console.log(`Total: ${total}`);
    console.log(`\x1b[32mPassed: ${passed}\x1b[0m`);
    console.log(`\x1b[31mFailed: ${failed}\x1b[0m`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      testResults.filter(t => !t.passed).forEach(t => {
        console.log(`  - ${t.name}${t.message ? `: ${t.message}` : ''}`);
      });
    }

    console.log('\n✨ Test suite completed!');

  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  } finally {
    if (server) {
      server.kill();
    }
    process.exit(testResults.some(t => !t.passed) ? 1 : 0);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Test interrupted by user');
  if (server) {
    server.kill();
  }
  process.exit(1);
});

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  if (server) {
    server.kill();
  }
  process.exit(1);
});
