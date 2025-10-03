@echo off
cd /d C:\source\MCP\web-agent-mcp
call npm install
call npm run build
node dist/index.js