# Test Strategy and Philosophy

This document outlines our comprehensive test strategy and philosophy for writing maintainable, effective tests.

## Test-Driven Development (TDD)

### TDD as a Design Methodology

Following t-wada's philosophy, we view TDD not merely as a testing technique, but as a **design methodology** that naturally leads to better software architecture. The act of writing tests first forces you to think about interfaces, dependencies, and the overall design before implementation.

### The TDD Cycle

1. **Red**: Write a failing test that describes the desired behavior
2. **Green**: Write the minimum code necessary to make the test pass
3. **Refactor**: Improve the code while keeping tests green

This rhythm is essential—as t-wada emphasizes, the quick feedback loop guides better design decisions.

### When to Use TDD (Following Khorikkov's Pragmatic Approach)

While we strongly recommend TDD, we follow Vladimir Khorikkov's pragmatic stance on when it provides the most value:

**Strongly Recommended for:**
- **Domain model and business logic** - Where TDD shines brightest
- **Complex algorithms** - Tests help clarify requirements
- **Bug fixes** - Write a failing test first to ensure the bug is fixed
- **Unclear requirements** - Tests help explore and clarify needs

**Optional for:**
- **Simple CRUD operations** - The design is already clear
- **Trivial code** - Getters, setters, simple mappings
- **UI-only changes** - Where the logic is minimal
- **Exploratory prototypes** - But add tests before merging

### Key Benefits (Aligned with Both Experts)

1. **Design Feedback**: As t-wada says, "Test pain indicates design problems"
2. **Living Documentation**: Tests serve as executable specifications
3. **Refactoring Confidence**: Per Khorikkov's "refactoring resistance" principle
4. **Reduced Debugging**: Bugs are caught at creation time
5. **YAGNI Enforcement**: You only write code that's actually tested and needed

### TDD Best Practices

1. **Listen to Test Pain**
   - Difficult setup → Too many dependencies
   - Many mocks → Poor boundaries
   - Brittle tests → Testing implementation details

2. **Keep Cycles Short**
   - Each cycle should take minutes
   - If it takes longer, break down the problem

3. **Test Behavior, Not Implementation**
   - This ensures tests remain valuable during refactoring
   - Aligns with our Sociable Unit Tests approach

4. **One Behavior Per Test**
   - Makes tests readable and failures clear
   - Supports t-wada's "tests as documentation" principle

### The Four Pillars of Good Tests (Khorikkov)

Whether using TDD or not, all tests should maximize:
1. **Protection against regressions**
2. **Resistance to refactoring**
3. **Fast feedback**
4. **Maintainability**

TDD naturally guides you toward these qualities, but they remain the ultimate goal.

## Testing Philosophy for AI Agents

### Test Behavior, Not Implementation

#### 1. What Makes a Good Test

- **Test public interfaces**: Focus on what consumers of the code can observe
- **Test contracts, not internals**: Verify the promises the code makes
- **Avoid implementation details**: Tests shouldn't break when refactoring
- **One behavior per test**: Each test should verify one specific behavior

#### 2. Mock Strategy - "Mock Only at Boundaries"

```
✅ Good reasons to mock:
- External APIs and services
- File system operations
- Database connections
- Time-dependent operations

❌ Avoid mocking:
- Business logic classes
- Internal modules
- Pure functions
- Data transformers
```

#### 3. Test Types and When to Use Them

**Sociable Unit Tests (Strongly Recommended - Default Approach)**
- Test a unit with its real collaborators
- Mock only external boundaries (APIs, DB, File System)
- Provides faster feedback on integration issues
- Much more confidence in refactoring
- Better reflects real-world usage
- Catches integration bugs early
- Reduces false positives from over-mocking

**Why Sociable Tests are Superior:**
- **Real confidence**: Tests prove components actually work together
- **Refactoring-friendly**: Internal changes don't break tests
- **Simpler tests**: No complex mock setup required
- **Better ROI**: One test validates multiple components working together
- **Fewer surprises**: What works in tests works in production

**Solitary Unit Tests (Use Only When Absolutely Necessary)**
- ONLY for pure algorithmic functions with complex logic
- ONLY when testing specific error conditions that are impossible to reproduce otherwise
- AVOID for any business logic that involves collaboration
- Should represent < 10% of your unit tests

**Integration Tests**
- Test across module boundaries
- Verify data flow through the system
- Use real implementations where possible

#### 4. Test Independence Principles

- **Isolated**: Each test runs independently
- **Repeatable**: Same result every time
- **Self-contained**: Test creates its own data
- **Order-independent**: Tests can run in any order

#### 5. Risk-Based Test Priority

```
High Priority (🔴):
- Core business logic that affects users
- Data integrity and persistence
- Security boundaries
- Money/payment related code

Medium Priority (🟡):
- User interactions and workflows
- Integration points between modules
- Error handling paths

Low Priority (🟢):
- Simple getters/setters
- Pure UI styling
- Configuration constants
```

#### 6. Test Naming and Structure

```javascript
describe('Component/Module name', () => {
  describe('when [context]', () => {
    it('should [expected behavior]', () => {
      // Arrange: Set up test data
      // Act: Execute the behavior
      // Assert: Verify the outcome
    });
  });
});
```

#### 7. What to Test vs What Not to Test

```
✅ Test:
- Business rules and logic
- Edge cases and error conditions
- Integration points
- Public API contracts

❌ Don't test:
- Framework code
- Third-party libraries
- Simple getters/setters
- Private implementation details
```

## Test Quality Guidelines

### Writing Maintainable Tests

#### 1. Test Structure
- Clear Arrange-Act-Assert pattern
- Descriptive test names that read like specifications
- Each test verifies ONE behavior
- Tests should be DAMP (Descriptive And Meaningful Phrases)

#### 2. Test Independence
- No shared state between tests
- Each test sets up its own data
- Tests can run in any order
- Clean up is automatic (use beforeEach/afterEach sparingly)

#### 3. Assertion Quality
- Assert on behavior, not implementation
- Use specific matchers (toBe vs toEqual)
- Include meaningful error messages
- Prefer positive assertions when possible

### Example Test Naming

```
❌ Bad: "test user creation"
❌ Bad: "should work"
✅ Good: "should create a new user with valid email"
✅ Good: "should reject user creation when email is already taken"
```

## Testing Perspectives for AI Agent Implementation

When implementing tests, consider these principles:

### Test Design Principles
- Focus on observable behavior from the consumer's perspective
- Test the contract this code provides to its users
- Verify one behavior per test for clarity

### Mock Strategy
- Identify external boundaries (APIs, DB, File system)
- Use real objects for internal collaborators
- Consider if this should be a sociable or solitary test
- Only mock what's necessary for test isolation

### Test Scenarios by Priority
1. **Happy path**: The primary use case that delivers value
2. **Edge cases**: Boundary values, empty inputs, null handling
3. **Error cases**: How the code handles and reports failures
4. **Integration**: How this code interacts with its collaborators

### Test Structure
- **Arrange**: Minimal setup for the scenario
- **Act**: Single action being tested
- **Assert**: Verify the observable outcome
- Use descriptive test names that explain the behavior

## Project Context

- This is a monorepo using pnpm workspaces
- Vitest for unit testing with happy-dom for React
- Playwright for E2E tests
- TypeScript strict mode is enabled
- Follow existing test patterns in the codebase