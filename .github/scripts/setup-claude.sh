#!/bin/bash
set -euo pipefail

# Create Claude settings directory
mkdir -p ~/.claude

# Create settings.json with hooks configuration
# Note: Using environment variable expansion here
cat > ~/.claude/settings.json << EOF
{
  "enableAllProjectMcpServers": true,
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "mcp__github_file_ops__commit_files",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c '${GITHUB_WORKSPACE}/.github/scripts/pre-commit-hook.sh'",
            "run_in_background": false
          }
        ]
      }
    ]
  }
}
EOF

echo "✅ Claude settings configured with pre-commit hook"
