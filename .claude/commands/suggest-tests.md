---
description: Analyze code changes and suggest comprehensive test coverage
---

# Test Coverage Analysis

You are a specialized test coverage analyzer. Your goal is to review code changes and suggest comprehensive test coverage to ensure code quality and prevent regressions.

## Analysis Process

### 1. Analyze Changed Files
- If PR context is available, get the PR diff to identify all modified files
- Otherwise, analyze the files or changes provided in $ARGUMENTS
- For each changed file, identify:
  - New functions, classes, or components added
  - Modified existing functionality
  - Deleted code that might affect tests
  - Dependencies and imports that might need testing

### 2. Analyze Code Usage and Dependencies
For each changed file, conduct thorough usage analysis:
- **Where is this code used?** Search for all imports and references
- **Who depends on this?** Identify all consumer components/modules
- **What features rely on this?** Map to user-facing functionality
- **What could break?** Assess potential impact radius
- **How critical is this code?** Determine business importance

### 3. Search for Existing Test Coverage
For each changed file:
- Look for corresponding test files (*.test.ts, *.test.tsx)
- Check if tests exist for the modified functionality
- Identify gaps in current test coverage
- Note any tests that might need updates due to changes

### 4. Identify Testing Requirements
Based on the usage analysis and changes, determine what types of tests are needed:
- **Unit Tests**: For individual functions, methods, or components
- **Integration Tests**: For features that interact with multiple modules
- **E2E Tests**: For user-facing features or critical user flows
- **Edge Cases**: Error handling, boundary conditions, null/undefined handling
- **Type Safety**: TypeScript type coverage for new interfaces/types

### 5. Generate Test Suggestions

Create a comprehensive test plan with the following structure:

## 📋 Test Coverage Report

### Summary
- Total files changed: X
- Files with existing tests: Y
- Files needing new tests: Z
- Critical areas requiring immediate attention: [list]

### Detailed Analysis

For each file that needs test coverage:

#### 📄 `path/to/file.ts`

**Changes Made:**
- Brief description of what changed

**Usage Analysis:**
- **Direct consumers**: List all files/components that import this
- **Indirect impact**: Features and flows affected by changes
- **User-facing features**: How changes affect end users
- **Critical paths**: Business-critical functionality that depends on this

**Current Test Coverage:**
- ✅ Existing tests in `path/to/file.test.ts` (if any)
- ❌ No tests found (if applicable)

**Suggested Tests:**

1. **Test Name: [Descriptive test name]**
   - **Type**: Unit/Integration/E2E
   - **Priority**: 🔴 High / 🟡 Medium / 🟢 Low
   - **What to test**: Specific functionality to verify
   - **Why this matters**: Business impact if this fails
   
   **Testing Perspectives for AI Agent:**
   ```
   Test Design Principles:
   - Focus on observable behavior from the consumer's perspective
   - Test the contract this code provides to its users
   - Verify one behavior per test for clarity
   
   Mock Strategy:
   - Identify external boundaries (APIs, DB, File system)
   - Use real objects for internal collaborators
   - Consider if this should be a sociable or solitary test
   - Only mock what's necessary for test isolation
   
   Test Scenarios by Priority:
   1. Happy path: The primary use case that delivers value
   2. Edge cases: Boundary values, empty inputs, null handling
   3. Error cases: How the code handles and reports failures
   4. Integration: How this code interacts with its collaborators
   
   Test Structure:
   - Arrange: Minimal setup for the scenario
   - Act: Single action being tested
   - Assert: Verify the observable outcome
   - Use descriptive test names that explain the behavior
   ```

### Test Quality Guidelines

For comprehensive test quality guidelines and testing philosophy, please refer to our [Test Strategy Documentation](../../docs/test-strategy.md).

## Project Context
- This is a monorepo using pnpm workspaces
- Vitest for unit testing with happy-dom for React
- Playwright for E2E tests
- TypeScript strict mode is enabled
- Follow existing test patterns in the codebase

## Usage
- In a PR context: The command will automatically analyze the PR diff
- For specific files: `/suggest-tests path/to/file.ts`
- For multiple files: `/suggest-tests file1.ts file2.tsx`
- General usage: `/suggest-tests` followed by description of changes