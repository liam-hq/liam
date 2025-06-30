---
name: test-coverage-plan
description: Create test case proposals with it.skip for improving test coverage
---

# Test Coverage Plan Command

You are tasked with improving test coverage for packages in this monorepo. Your goal is to create test case proposals using `it.skip` to outline test scenarios without implementing them.

Arguments received: $ARGUMENTS

## Process:

1. Parse the arguments to extract:
   - Package name (e.g., `db-structure`, `erd-core`, `ui`, `cli`)
   - Any custom instructions or specific focus areas

2. Run the test coverage command for the specified package:
   ```bash
   cd frontend/packages/[package-name] && pnpm test:coverage
   ```

3. Analyze the coverage report to identify files with low or 0% coverage

4. For each file that needs coverage:
   - Read and understand the implementation
   - Create a test file if it doesn't exist (following the pattern: `src/path/to/file.test.ts`)
   - Write test case names using `it.skip` that cover all important scenarios
   - Include edge cases and error handling scenarios

## Guidelines:

- Focus on files with 0% coverage first
- Write descriptive test case names that clearly explain what is being tested
- Group related test cases using `describe` blocks
- Add `// TODO: Implement test` comments in the test body
- Do NOT implement the actual test logic, only the test structure and names
- Follow the existing test patterns in the codebase
- Use appropriate testing utilities based on the package (vitest for most packages)
- Apply any custom instructions provided in the arguments

## Test Case Naming Patterns:

- "should [expected behavior] when [condition]"
- "should handle [edge case/error scenario]"
- "should return [expected value] for [input scenario]"
- "should throw [error type] when [invalid condition]"

## Example Output:

```typescript
import { describe, it } from 'vitest'
import { functionName } from './functionName.js'

describe('functionName', () => {
  it.skip('should return expected value when given valid input', () => {
    // TODO: Implement test
  })

  it.skip('should handle null/undefined inputs gracefully', () => {
    // TODO: Implement test
  })

  it.skip('should throw error when invalid parameters are provided', () => {
    // TODO: Implement test
  })

  it.skip('should handle edge case with empty array', () => {
    // TODO: Implement test
  })
})
```

## Coverage Thresholds:

Most packages in this monorepo aim for 80% coverage threshold. Files below this threshold should be prioritized.

## Approach Strategy:

1. **Phase 1**: Create test case proposals with `it.skip`
2. **Phase 2**: Human review of proposed test cases
3. **Phase 3**: Implementation of approved test cases

This phased approach ensures:
- Test cases are relevant and valuable
- No unnecessary or redundant tests are implemented
- Clear understanding of testing goals before implementation

## Usage Examples:

- `/test-coverage-plan db-structure` - Analyze db-structure package
- `/test-coverage-plan erd-core focus on visualization components` - Analyze erd-core with specific focus
- `/test-coverage-plan ui prioritize hooks and utilities` - Analyze ui package with priority guidance