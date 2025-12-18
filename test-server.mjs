// Test script for Web Agent MCP Server
// This tests the server's basic functionality

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Testing Web Agent MCP Server...\n');

// Start the server
const serverPath = path.join(__dirname, 'dist', 'index.js');
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Handle server output
server.stdout.on('data', (data) => {
  const output = data.toString();
  try {
    const json = JSON.parse(output);
    console.log('Server Response:', JSON.stringify(json, null, 2));
  } catch {
    // Not JSON, just log it
    if (output.trim()) {
      console.log('Server Output:', output);
    }
  }
});

server.stderr.on('data', (data) => {
  const error = data.toString();
  if (!error.includes('Web Agent MCP Server running')) {
    console.error('Server Error:', error);
  } else {
    console.log('✓ Server started successfully');
    runTests();
  }
});

server.on('close', (code) => {
  console.log(`\nServer exited with code ${code}`);
});

// Test functions
async function runTests() {
  console.log('\nRunning tests...\n');

  // Test 1: List tools
  await sendRequest({
    jsonrpc: '2.0',
    method: 'tools/list',
    id: 1
  });

  // Test 2: List resources
  await sendRequest({
    jsonrpc: '2.0',
    method: 'resources/list',
    id: 2
  });

  // Give server time to respond
  setTimeout(() => {
    console.log('\n✓ Basic connectivity tests completed');
    console.log('\nTo test browser automation:');
    console.log('1. Restart Claude Desktop');
    console.log('2. Use the MCP tools in any Claude Code instance');
    console.log('\nAvailable tools: navigate, click, type, screenshot, etc.');
    process.exit(0);
  }, 2000);
}

function sendRequest(request) {
  return new Promise((resolve) => {
    const requestStr = JSON.stringify(request) + '\n';
    console.log(`Sending: ${request.method} (id: ${request.id})`);
    server.stdin.write(requestStr);
    setTimeout(resolve, 500);
  });
}

// Handle exit
process.on('SIGINT', () => {
  console.log('\n\nShutting down server...');
  server.kill();
  process.exit(0);
});