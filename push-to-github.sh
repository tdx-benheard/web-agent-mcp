#!/bin/bash

# Replace YOUR_USERNAME with your GitHub username
GITHUB_USERNAME="YOUR_USERNAME"

# Add remote origin
git remote add origin https://github.com/${GITHUB_USERNAME}/web-agent-mcp.git

# Push to GitHub
git branch -M main
git push -u origin main

echo "Repository pushed to GitHub!"
echo "Visit: https://github.com/${GITHUB_USERNAME}/web-agent-mcp"