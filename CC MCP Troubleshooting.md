# Claude Code MCP Troubleshooting

## Problem
`/mcp` showed "No MCP servers configured" even though MCP server was set up in multiple places.

## Root Cause
- Claude Code CLI uses `~/.claude.json` (NOT `~/.claude/config.json` which is for Claude Desktop)
- Project-specific `"mcpServers": {}` in `.claude.json` was overriding user-level config
- Default scope is `local` (project-specific), not `user` (global)

## Solution
```bash
# Add MCP server globally for all projects
claude mcp add --scope user aamcp-browser node C:/AAMCP/dist/index.js
```

## Tips for AI Assistants

1. **Always use `--scope user`** when adding MCP servers unless explicitly asked for project-specific
2. **Config file is `.claude.json`** (in home directory), not `.claude/config.json`
3. **Check for empty project configs** - they override user-level settings
4. **Verify with `/mcp`** after making changes

## Quick Reference
```bash
# Add user-level (all projects)
claude mcp add --scope user <name> <command> [args...]

# Remove server
claude mcp remove <name>

# List servers
claude mcp list
```
