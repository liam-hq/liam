---
name: plan-regression-tests
description: Plan regression tests for existing code with it.skip statements
---

# Plan Regression Tests Command

Create `it.skip` test proposals for existing code. Document current behavior, not ideal behavior.

Arguments: $ARGUMENTS

## Task

1. Run: `cd frontend/packages/[package-name] && pnpm test:coverage`
2. Find files <80% coverage
3. Skip low-value targets (see @docs/test-principles.md)
4. Write `it.skip` statements only

## Critical Rules

- **ONLY `it.skip`** - No implementation
- **Document WHAT IS** - Current behavior, even if "wrong"
- **No test code** - Just descriptions

## Example

```typescript
describe("Component", () => {
  it.skip("returns null when user not found (current behavior)", () => {
    // TODO: Implement test
  });
});
```

For principles and detailed guidance: @docs/test-principles.md
