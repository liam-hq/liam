# Debugging Guide

## Enable Debug Logs

To see detailed LangChain and LangGraph logs, set the following environment variables:

```bash
# Enable LangChain debug logs
export LANGCHAIN_VERBOSE=true
export LANGCHAIN_TRACING_V2=true

# Run with debug logs
LIAM_OFFLINE_MODE=true LANGCHAIN_VERBOSE=true pnpm --filter @liam-hq/schema-bench executeLiamDB
```

## Timeout Settings

The script has a global timeout of 5 minutes. If you need to change this:
- Edit `src/cli/executeLiamDb.ts`
- Change `GLOBAL_TIMEOUT_MS` value

## Monitoring Progress

All LangChain logs are now output to stderr, so you can redirect them:

```bash
# Save logs to file
LIAM_OFFLINE_MODE=true pnpm --filter @liam-hq/schema-bench executeLiamDB 2>debug.log

# View logs in real-time
LIAM_OFFLINE_MODE=true pnpm --filter @liam-hq/schema-bench executeLiamDB 2>&1 | tee full-output.log
```