import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = join(__dirname, 'dist', 'index.js');

// Start MCP server
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'inherit']
});

let messageId = 1;

function sendRequest(method, params = {}) {
  const request = {
    jsonrpc: '2.0',
    id: messageId++,
    method,
    params
  };

  server.stdin.write(JSON.stringify(request) + '\n');
}

function sendTool(name, args = {}) {
  sendRequest('tools/call', {
    name,
    arguments: args
  });
}

let buffer = '';
server.stdout.on('data', (data) => {
  buffer += data.toString();
  const lines = buffer.split('\n');

  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    if (line) {
      try {
        const response = JSON.parse(line);
        console.log('Response:', JSON.stringify(response, null, 2));
      } catch (e) {
        console.log('Non-JSON output:', line);
      }
    }
  }

  buffer = lines[lines.length - 1];
});

// Test sequence
setTimeout(() => {
  console.log('\n=== Initializing ===');
  sendRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test-client', version: '1.0.0' }
  });
}, 500);

setTimeout(() => {
  console.log('\n=== Navigating to time report page ===');
  sendTool('navigate', {
    url: 'https://solutions.teamdynamix.com/TDNext/Apps/Time/PendingTimeReports.aspx'
  });
}, 1500);

setTimeout(() => {
  console.log('\n=== Testing query_page tool ===');
  sendTool('query_page', {
    queries: [
      {
        name: 'employee',
        selector: '#TimeReportUser',
        extract: 'text'
      },
      {
        name: 'total_hours',
        selector: '.TRListTotalCell strong',
        extract: 'text',
        index: -1
      },
      {
        name: 'period_start',
        selector: '#TPStart',
        extract: 'text'
      },
      {
        name: 'period_end',
        selector: '#TPEnd',
        extract: 'text'
      }
    ]
  });
}, 5000);

setTimeout(() => {
  console.log('\n=== Cleaning up ===');
  server.kill();
  process.exit(0);
}, 8000);
