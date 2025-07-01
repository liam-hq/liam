---
name: test-coverage-proposals
description: Create test case proposals with it.skip for improving test coverage
---

# Test Coverage Proposals Command

Plan regression tests for existing code. Output `it.skip` statements only.

Arguments: $ARGUMENTS

## Process

1. Parse package name: `db-structure`, `erd-core`, `ui`, `cli`
2. Run: `cd frontend/packages/[package-name] && pnpm test:coverage`
3. Find files <80% coverage
4. Create test proposals following @docs/regression-test-planning.md

## Key Rules

- **Only `it.skip`** - No implementation
- **Document current behavior** - Not ideal behavior
- **Follow Khorikkov & t-wada** - Test observable behavior, note design pain

## Priority

1. 0% coverage files
2. <80% coverage
3. Complex/critical logic

## Never

- ❌ Write test code
- ❌ Add expect()
- ❌ Create mocks
- ❌ Judge if behavior is "correct"

## Example

```typescript
describe('existingFunction', () => {
  it.skip('returns null for invalid input (current behavior)', () => {
    // TODO: Implement test
  })
})
```