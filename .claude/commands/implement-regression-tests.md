---
name: implement-regression-tests
description: Implement regression tests marked with it.skip
---

# Implement Regression Tests Command

Implement tests marked with `it.skip`. Test current behavior as it exists today.

Arguments: $ARGUMENTS

## Task

1. Find `it.skip` tests in the specified file/directory
2. Change `it.skip` to `it`
3. Implement test body based on CURRENT behavior
4. Run tests to verify they pass

## Critical Rules

- **Test CURRENT behavior** - Not ideal behavior
- **Tests MUST pass** - They document what IS
- **Follow test principles** - See @docs/test-principles.md
- **Minimal mocking** - Only at external boundaries

## Example

```typescript
// Before (it.skip)
it.skip('returns null when user not found (current behavior)', () => {
  // TODO: Implement test
})

// After (implemented)
it('returns null when user not found (current behavior)', () => {
  const result = getUserById('non-existent-id')
  expect(result).toBeNull()
})
```

Remember: These are regression tests - they protect existing behavior from breaking.