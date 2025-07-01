# Regression Test Planning Guide

Based on Khorikkov's "Unit Testing Principles" - regression tests protect existing behavior, not ideal behavior.

## Your Task

Create test case proposals (`it.skip`) for existing code lacking coverage. Document WHAT IS, not what should be.

## Key Principles (Khorikkov & t-wada)

1. **Test observable behavior** - What consumers can see
2. **Regression ≠ TDD** - Document current state, don't design new behavior  
3. **"Test pain reveals design issues"** (t-wada) - Note hard-to-test areas

## Process

1. **Read code** → Understand actual behavior
2. **Write test names** → Use `it.skip` only
3. **Focus on protection** → What would break users if changed?

## What Makes a Good Regression Test Target?

Per Khorikkov's "observable behavior" principle:

✅ **High Value**: Code with observable behavior that consumers rely on
- Business logic and algorithms
- Data transformations
- State management
- Public API contracts

❌ **Low Value**: Code without meaningful runtime behavior
- Re-exports (module organization only)
- Type definitions (compile-time only)
- Simple constants (no computation)
- Pure configuration (static data)

## Priority

🔴 **Critical**: Frequently used, complex logic, scheduled for refactoring  
🟡 **Medium**: Shared utilities, data transformations  
🟢 **Low**: Simple code, already covered by integration tests

## Format

```typescript
describe('Component', () => {
  it.skip('returns null when user not found (current behavior)', () => {
    // TODO: Implement test
  })
})
```

## Remember

- Document actual behavior (even if "wrong")
- No implementation code
- No value judgments
- Just `it.skip` statements

After planning, engineers implement tests following Khorikkov's Four Pillars:
1. Protection against regressions
2. Resistance to refactoring  
3. Fast feedback
4. Maintainability