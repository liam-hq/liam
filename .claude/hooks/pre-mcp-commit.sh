#!/bin/bash

# Find git root directory
GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -z "$GIT_ROOT" ]; then
  echo '{"continue": false, "message": "Not in a git repository"}' | jq -c
  exit 2
fi

cd "$GIT_ROOT"

echo "Running pre-commit checks before MCP GitHub commit..."

# Run pnpm fmt
echo "Running pnpm fmt..."
pnpm fmt
FMT_EXIT=$?

# Run pnpm lint
echo "Running pnpm lint..."
pnpm lint
LINT_EXIT=$?

if [ $FMT_EXIT -eq 0 ] && [ $LINT_EXIT -eq 0 ]; then
  echo "Pre-commit checks passed!"
  echo '{"continue": true}' | jq -c
else
  echo "Pre-commit checks failed!"
  echo '{"continue": false, "message": "Pre-commit checks failed. Please fix formatting and linting issues before committing via GitHub API."}' | jq -c
  exit 2
fi