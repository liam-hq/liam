# Research: SQL Syntax Validation Migration

## Current Architecture Analysis

### saveDmlOperationsTool Location and Pattern

**Decision**: Follow `saveTestcaseTool.ts` pattern in `frontend/internal-packages/agent/src/qa-agent/tools/saveDmlOperationsTool.ts`  
**Rationale**: The specification indicates implementation should follow the `saveTestcaseTool.ts` pattern which uses:

- Valibot schema validation for tool input
- Error handling with `WorkflowTerminationError`
- Tool message dispatch with `dispatchCustomEvent`
- Command return with state updates
  **Alternatives considered**: Creating new validation service, but tool-level validation matches existing architecture

### pgParse Integration Pattern

**Decision**: Import `pgParse` from `@liam-hq/schema/parser` and integrate directly in tool validation  
**Rationale**:

- Already used in `PGliteInstanceManager.ts` line 34-50
- Provides `PgParseResult` interface with error handling
- Consistent error message format across validation points
  **Alternatives considered**: Creating wrapper service, but direct usage maintains simplicity

### Error Handling Strategy

**Decision**: Throw regular `Error`s for validation failures to trigger LangGraph retry mechanism  
**Rationale**:

- LangGraph automatically converts thrown `Error`s to appropriate `ToolMessage`s
- Thrown errors enable built-in LLM self-healing/regeneration (FR-004)
- Error state prevents saving invalid SQL (FR-003)
- LangGraph handles retry logic automatically (FR-007: 3 attempts)
- Pattern follows `saveRequirementsToArtifactTool.ts` approach
  **Alternatives considered**: Manual `ToolMessage` responses, but throwing errors integrates better with LangGraph retry mechanism

### Retry Mechanism Implementation

**Decision**: Use LangGraph's built-in retry mechanism via thrown `Error`s  
**Rationale**:

- Throwing `Error`s automatically triggers LangGraph retry logic
- LangGraph handles retry attempts and attempt counting
- Separates concerns: validation vs. orchestration
- Aligns with `saveRequirementsToArtifactTool.ts` pattern
- No manual retry state management required
  **Alternatives considered**: Manual retry logic in tool, but LangGraph's built-in mechanism is more robust

### PGliteInstanceManager Simplification

**Decision**: Make syntax checking optional/configurable in execution path  
**Rationale**:

- Remove redundant validation for pre-validated SQL
- Maintain fallback for backward compatibility (FR-005)
- Performance improvement by avoiding double parsing
  **Alternatives considered**: Complete removal, but fallback ensures robustness

## Dependencies and Integration Points

### Schema Validation Extension

**Decision**: Extend existing valibot schemas to include syntax validation  
**Rationale**:

- `dmlOperationSchema` from `@liam-hq/artifact` needs syntax validation
- Consistent with existing validation patterns
- Type-safe approach using existing schema infrastructure
  **Alternatives considered**: Runtime-only validation, but schema integration provides better type safety

### Error Message Consistency

**Decision**: Create shared error formatting utility for SQL syntax errors  
**Rationale**:

- Ensures consistent error messages between generation and execution (FR-009)
- Reusable across validation points
- Better user experience with standardized error format
  **Alternatives considered**: Duplicate error handling, but consistency requirement necessitates shared approach

### Testing Strategy

**Decision**: Follow existing test patterns with contract tests for validation behavior  
**Rationale**:

- Test syntax validation success/failure scenarios
- Verify retry mechanism behavior
- Integration tests for end-to-end workflow
  **Alternatives considered**: Unit tests only, but integration tests ensure workflow compliance

## Performance Considerations

### Validation Timing Impact

**Decision**: Accept potential latency increase during DML generation for better UX  
**Rationale**:

- Early error detection outweighs performance cost
- No specific performance requirements (FR-006)
- Users benefit from immediate feedback vs. delayed execution errors
  **Alternatives considered**: Asynchronous validation, but immediate feedback requirement necessitates synchronous approach

### Caching Strategy

**Decision**: No caching for initial implementation  
**Rationale**:

- SQL statements are typically unique per generation
- Caching complexity not justified for initial version
- Can be added later if performance becomes issue
  **Alternatives considered**: LRU cache for parsed results, but premature optimization for current needs

## Implementation Scope

### Files Requiring Changes

1. `frontend/internal-packages/agent/src/qa-agent/tools/saveDmlOperationsTool.ts` - Add syntax validation
2. `frontend/packages/pglite-server/src/PGliteInstanceManager.ts` - Make syntax checking optional
3. Shared error formatting utility
4. Test files for validation behavior

### Backward Compatibility Approach

**Decision**: Maintain existing interfaces while adding validation internally  
**Rationale**:

- Tool API remains unchanged for external consumers
- Internal validation enhancement transparent to callers
- Fallback validation in execution path ensures robustness
  **Alternatives considered**: Breaking API changes, but compatibility requirement prevents this approach

All research findings support feasibility of the proposed approach with clear implementation path following existing architectural patterns.
