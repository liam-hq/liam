#!/bin/bash
set -euo pipefail

# Ensure GITHUB_WORKSPACE is set
if [ -z "${GITHUB_WORKSPACE:-}" ]; then
    echo "❌ Error: GITHUB_WORKSPACE is not set" >&2
    exit 1
fi

# Create Claude settings directory
mkdir -p "$HOME/.claude"

# Create settings.json with hooks configuration
# Note: Using environment variable expansion here
cat > "$HOME/.claude/settings.json" << EOF
{
  "enableAllProjectMcpServers": true,
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "mcp__github_file_ops__commit_files",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'cd $GITHUB_WORKSPACE && echo \"🔍 Pre-commit validation starting...\" >&2 && pnpm fmt && pnpm lint && echo \"✅ All checks passed\" >&2 || { echo \"❌ Pre-commit validation failed\" >&2 && exit 2; }'",
            "run_in_background": false
          }
        ]
      }
    ]
  }
}
EOF

echo "✅ Claude settings configured with pre-commit hook"
