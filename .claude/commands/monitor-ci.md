# Monitor CI Checks

Monitors pull request CI checks until they are resolved (pass or fail).

## Usage

When asked to monitor CI checks, Claude will:

1. Run `gh pr checks --watch` to continuously monitor the status
2. Wait until all checks are completed
3. Report the final status of all checks
4. If checks fail, analyze the failure logs and suggest fixes

## Command

```bash
# Monitor PR checks in watch mode
gh pr checks --watch

# Alternative: Check status once
gh pr checks

# View specific check details if needed
gh pr checks --verbose
```

## Workflow

1. **Start Monitoring**: Run `gh pr checks --watch` immediately after PR creation or when requested
2. **Track Progress**: The command will show real-time updates of all CI checks
3. **Completion**: Wait until all checks show as either ✓ (passed) or X (failed)
4. **Action on Failure**: 
   - If any checks fail, use `gh pr checks --verbose` to get detailed logs
   - Analyze the failure and suggest or implement fixes
   - After fixes, push changes and monitor again

## Example Output

```
Refreshing checks status every 10 seconds. Press Ctrl+C to quit.

NAME                    STATUS      CONCLUSION
Build                   completed   success     ✓
Lint                    completed   success     ✓
Test                    completed   failure     X
Type Check              in_progress -           ◐

Some checks were not successful
```

## Important Notes

- The `--watch` flag refreshes every 10 seconds
- Press Ctrl+C to stop monitoring
- Always wait for all checks to complete before proceeding
- If checks fail, investigate and fix issues before merging