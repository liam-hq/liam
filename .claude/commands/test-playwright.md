---
allowed-tools: mcp__playwright__browser_navigate, mcp__playwright__browser_snapshot, mcp__playwright__browser_click, mcp__playwright__browser_type, mcp__playwright__browser_press_key, mcp__playwright__browser_take_screenshot, mcp__playwright__browser_wait_for, Bash, Read
description: Test application functionality using Playwright MCP based on PR number or test description
---

## Test Target
You need to test: $ARGUMENTS

## Instructions

1. **Analyze the test target**
   - If $ARGUMENTS is a number (e.g., "2237"), treat it as a PR number and run `gh pr view $ARGUMENTS` to understand what was fixed
   - If $ARGUMENTS is descriptive text, use it as the test scenario description

2. **Set up the test environment**
   - Navigate to http://localhost:3001 using Playwright MCP
   - If authentication is required, use these credentials:
     - Email: test@example.com
     - Password: liampassword1234
   - Reference: @frontend/internal-packages/e2e/tests/e2e/login-and-design-session.test.ts

3. **Execute the test**
   - Based on the test target, perform the necessary actions
   - Use `mcp__playwright__browser_snapshot` to understand page state before interactions
   - Take screenshots at important moments for documentation

4. **Verify results**
   - Confirm the expected behavior is working
   - Document any issues found
   - Provide a clear summary of the test results

## Example Test Flows

### For PR verification
- Check what the PR fixed
- Reproduce the scenario that was previously broken
- Verify the fix is working

### For feature testing
- Navigate to the relevant page
- Perform user actions
- Verify expected outcomes

## Important Notes
- Always wait for async operations to complete
- Take screenshots to document the test process
- Report both successes and failures clearly