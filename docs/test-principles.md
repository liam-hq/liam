# Test Principles

Core testing principles that apply to all tests - whether adding regression tests to existing code or writing tests for new features.

## The Four Pillars of Good Tests (Vladimir Khorikov)

All tests should maximize:

1. **Protection against regressions** - Catch breaking changes
2. **Resistance to refactoring** - Don't break when internals change
3. **Fast feedback** - Run quickly for rapid iteration
4. **Maintainability** - Easy to understand and modify

## Core Principle: Test Observable Behavior

Per Khorikov's "observable behavior" principle:

- Test what consumers can see and use
- Test the contract, not the implementation
- Tests should survive refactoring of internals

## Test Pain Reveals Design Issues (t-wada)

"Test pain indicates design problems" - When tests are hard to write:

- Difficult setup → Too many dependencies
- Many mocks → Poor boundaries
- Brittle tests → Testing implementation details

## What Makes a Good Test Target?

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

## Test Priority

🔴 **Critical**:

- Core business logic that affects users
- Frequently used, complex logic
- Code scheduled for refactoring
- Data integrity and persistence
- Security boundaries
- Money/payment related code

🟡 **Medium**:

- Shared utilities and data transformations
- User interactions and workflows
- Integration points between modules
- Error handling paths

🟢 **Low**:

- Simple code with trivial logic
- Code already covered by integration tests
- Simple getters/setters
- Pure UI styling
- Configuration constants

## What to Test vs What Not to Test

✅ **Test**:

- Business rules and logic
- Edge cases and error conditions
- Integration points
- Public API contracts
- Complex algorithms
- Data transformations

❌ **Don't test**:

- Framework code
- Third-party libraries
- Simple getters/setters
- Private implementation details
- Re-export modules
- Type-only files

## Key Takeaways

1. **One behavior per test** - Each test should verify one specific behavior
2. **Test public interfaces** - Focus on what consumers can observe
3. **Avoid implementation details** - Tests shouldn't break when refactoring
4. **Document behavior, not ideals** - Tests describe what IS, not what should be
