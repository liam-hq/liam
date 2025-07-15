#!/bin/bash
set -euo pipefail
cd $GITHUB_WORKSPACE
echo "🔍 Pre-commit validation starting..." >&2
echo "📁 Working in: $(pwd)" >&2

# Format check
FMT_OUTPUT=$(pnpm fmt 2>&1)
FMT_CODE=$?
if [ $FMT_CODE -ne 0 ]; then
    echo "❌ Format check failed (exit $FMT_CODE):" >&2
    echo "$FMT_OUTPUT" >&2
    echo "" >&2
    echo "🚨 COMMIT BLOCKED: You MUST fix all format issues before committing" >&2
    echo "🔧 Run: pnpm fmt" >&2
    exit 2
fi
echo "✅ Format check passed" >&2

# Lint check
LINT_OUTPUT=$(pnpm lint 2>&1)
LINT_CODE=$?
if [ $LINT_CODE -ne 0 ]; then
    echo "❌ Lint check failed (exit $LINT_CODE):" >&2
    echo "$LINT_OUTPUT" >&2
    echo "" >&2
    echo "🚨 COMMIT BLOCKED: You MUST fix all lint violations before committing" >&2
    echo "🔧 Step 1: Run pnpm lint --fix (auto-fixes what it can)" >&2
    echo "🔧 Step 2: Manually fix remaining violations" >&2
    echo "🔧 Step 3: Run pnpm lint again to verify all issues are resolved" >&2
    echo "💡 DO NOT disable lint rules - fix the code instead!" >&2
    exit 2
fi
echo "✅ Lint check passed" >&2
echo "🎉 All checks passed!" >&2
