# Research: AnalyzedRequirements Schema Migration

## Overview
Research findings for migrating `analyzedRequirements` schema from `businessRequirement`/`functionalRequirements` to `goal`/`testcases` structure in the LangGraph agent system.

## Schema Migration Strategy

### Decision: Three-Phase Migration with Parallel Field Approach
**Rationale**:
- Enables parallel development without breaking existing workflows
- Allows gradual validation of new schema before full cutover
- Minimizes risk by maintaining rollback capability during transition
- PR #3666 validated that goal/testcases structure improves generation quality

**Alternatives Considered**:
- Direct field replacement: Rejected due to high risk of breaking workflows in progress
- Feature flag approach: Rejected as overly complex for schema migration
- Database migration pattern: Rejected as state is transient (not persisted long-term)

### Validation Findings from PR #3666

**What Was Validated**:
- `businessRequirement` → `goal` (string) improves semantic clarity
- `functionalRequirements` → `testcases` (array) provides better structure
- Testcase schema: `{ title, type, sql, testResults }` enables better SQL generation
- Type field enum: `INSERT/UPDATE/DELETE/SELECT` for SQL operation types

**Quality Improvements Observed**:
- Clearer traceability from business objectives to test scenarios
- Simplified data flow between PM and QA agents
- Better prompt engineering with goal-based terminology
- More structured test case generation

## LangGraph State Management

### Decision: Use Annotation.Root for Schema Definition
**Rationale**:
- LangGraph's recommended pattern for typed state definitions
- Provides compile-time type safety for state transitions
- Supports explicit reducers for state merging logic
- Enables private state between nodes when needed

**Implementation Pattern**:
```typescript
const RequirementsAnnotation = Annotation.Root({
  goal: Annotation<string>(),
  testcases: Annotation<Array<{
    title: string;
    type: 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT';
    sql: string;
    testResults: unknown;
  }>>({
    reducer: (x, y) => y, // Replace strategy
    default: () => [],
  }),
});
```

**Alternatives Considered**:
- Untyped state objects: Rejected for lack of type safety
- Valibot runtime validation only: Rejected - need compile-time safety too
- Shared mutable state: Rejected - violates Constitution principle III

## Agent Prompt Updates

### Decision: Goal-Based Prompt Engineering for PM Agent
**Rationale**:
- "Goal" is more intuitive than "business requirement" for AI models
- Aligns with user mental model of stating objectives
- Reduces token usage with clearer, simpler terminology
- Validated in PR #3666 to improve generation quality

**PM Agent Prompt Changes**:
- Update system prompt to request "goal" instead of "business requirement"
- Modify output schema to use `requirements.goal` field
- Emphasize goal-driven test case generation

**Alternatives Considered**:
- Keep "business requirement" term: Rejected due to proven quality improvements
- Use "objective" instead of "goal": Rejected - "goal" is more natural

## QA Agent Logic Updates

### Decision: SQL Generation Focus for QA Agent
**Rationale**:
- QA Agent's primary role: Generate SQL for testcases based on title and type
- SQL execution is handled by separate test tool (runTestTool)
- Structured testcase array enables map-reduce pattern for parallel SQL generation
- Type field (`INSERT/UPDATE/DELETE/SELECT`) guides SQL generation strategy
- Clearer separation of concerns: QA generates SQL, test tool executes

**QA Agent Changes**:
- Consume `requirements.testcases` array instead of `analyzedRequirements.functionalRequirements`
- Generate SQL for each testcase based on title and type fields
- Implement validation for testcase type enum
- Validate SQL syntax using pgParse before saving
- Use saveTestcaseTool to save testcases with generated SQL
- Use map-reduce pattern for parallel SQL generation

**Test Execution** (separate from QA Agent):
- runTestTool executes DDL + testcase SQL
- Populates testcase.testResults with execution logs
- Returns success/failure status for each testcase

**Alternatives Considered**:
- Keep functional requirements structure: Rejected due to quality improvements
- QA Agent executes tests: Rejected - separation of SQL generation and execution is clearer
- Flatten testcase structure: Rejected - nesting provides better organization

## Routing Logic Updates

### Decision: Update State Access Patterns
**Rationale**:
- Routing must read from `requirements` field instead of `analyzedRequirements`
- Maintains type safety with new state schema
- Enables conditional routing based on goal/testcases presence

**Changes Needed**:
- Update lead agent routing to check `state.requirements`
- Modify PM→QA handoff to pass `requirements` field
- Ensure backward compatibility during Phase 1 (check both fields)

## Validation Strategy

### Decision: Runtime Validation with Valibot Schemas + Field Omission Pattern
**Rationale**:
- Valibot is already used in the codebase for schema validation
- Compile-time TypeScript types + runtime validation = comprehensive safety
- Efficient performance characteristics for agent workflows
- Clear error messages for validation failures
- **Field omission pattern**: Omit fields from tool schema to control LLM behavior
  - State annotation: sql field is required
  - PM Agent tool schema: sql field omitted (v.omit) - LLM doesn't see it, won't generate it
  - QA Agent tool schema: sql field included - LLM sees it, generates it

**Validation Points**:
1. PM agent output: Validate using pmAgentRequirementsSchema (sql omitted)
2. QA agent output: Validate using requirementsSchema (sql included)
3. Testcase type field: Ensure only valid SQL operation types
4. State transitions: Type-safe updates via LangGraph Annotation (sql required)

**Design Pattern Benefits**:
- Prevents LLM from generating SQL when not needed (PM Agent)
- Guides LLM to generate SQL when needed (QA Agent)
- State schema remains strict (sql always required)
- Tool schemas control what LLM sees and generates

**Alternatives Considered**:
- Optional sql field in state: Rejected - LLM would generate it unnecessarily
- Zod validation: Rejected - Valibot is already standardized
- Manual validation: Rejected - error-prone and harder to maintain
- No runtime validation: Rejected - external AI output needs validation

## Testing Strategy

### Decision: Integration Tests for Agent Workflows
**Rationale**:
- Agent package has dedicated integration test suite (vitest.config.integration.ts)
- Test complete workflows: PM generation → QA consumption
- Validate both old and new schemas during Phase 1
- Ensure no regression in test case quality

**Test Coverage**:
1. PM agent generates requirements with goal/testcases structure
2. QA agent successfully processes testcases array
3. Routing logic correctly handles requirements field
4. Validation catches invalid testcase types
5. Migration phases work correctly (parallel fields → cutover → cleanup)

**Alternatives Considered**:
- Unit tests only: Rejected - need end-to-end validation
- Manual testing: Rejected - automated tests catch regressions
- No migration testing: Rejected - high-risk change needs validation

## Performance Considerations

### Decision: No Performance Impact Expected
**Rationale**:
- Schema simplification reduces token usage (goal vs businessRequirement)
- Structured testcases enable parallel processing (map-reduce)
- No additional database queries or external calls
- State transitions remain O(1) operations

**Monitoring Points**:
- Token usage for PM agent prompts (expect reduction)
- QA agent processing time (expect improvement with parallel processing)
- Memory usage for state management (expect no change)

## Rollback Strategy

### Decision: Phase-Based Rollback Capability
**Rationale**:
- Phase 1: Easy rollback (just stop using new field, remove it)
- Phase 2: Can revert agent changes independently
- Phase 3: Only after full validation, remove old field

**Rollback Process**:
1. If issues in Phase 1: Stop populating requirements field, remove schema
2. If issues in Phase 2: Revert agent prompts/logic, keep both fields
3. Phase 3 only proceeds after full confidence in new schema

## Summary

All technical unknowns resolved. The migration strategy is:
1. **Phase 1**: Add `requirements` field alongside `analyzedRequirements`
2. **Phase 2**: Migrate PM prompts, QA logic, routing to use `requirements`
3. **Phase 3**: Remove `analyzedRequirements` field after validation

Key technical decisions:
- **State Schema**: Use LangGraph Annotation.Root with sql field required
- **Tool Schema Pattern**: Use v.omit to control what LLM sees
  - PM Agent tool: Omit sql field (LLM won't generate SQL)
  - QA Agent tool: Include sql field (LLM will generate SQL)
- **Validation**: Valibot for runtime validation
  - pmAgentRequirementsSchema for PM agent (sql omitted)
  - requirementsSchema for QA agent and state (sql required)
- **Prompt Engineering**: Goal-based terminology for PM agent
- **SQL Generation**: QA agent generates SQL, test tool executes
- **Testing**: Integration tests for end-to-end workflow validation
- **Migration**: Phase-based with rollback capability
