# Contracts

This directory contains TypeScript contracts that define the interface boundaries for the schema migration.

## Contract Files

### pm-agent-output.contract.ts
Defines schemas for PM agent and complete requirements:

**Complete Schemas (for state)**:
- `requirementsSchema`: Complete requirements with goal and testcases (sql required)
- `testcaseSchema`: Full testcase structure with sql (required)
- `testcaseType`: Enum for SQL operation types (INSERT/UPDATE/DELETE/SELECT)

**PM Agent Schemas (for tool)**:
- `pmAgentRequirementsSchema`: Requirements with testcases without sql
- `pmAgentTestcaseSchema`: Testcase without sql and testResults (v.omit)

**Design Pattern**:
- State annotation uses complete schema (sql required)
- PM Agent tool schema omits sql field to prevent LLM from generating it
- QA Agent tool schema includes sql field so LLM generates it

**Usage**:
- PM Agent tool: Use `pmAgentRequirementsSchema` (sql omitted)
- QA Agent tool: Use `requirementsSchema` (sql included)
- State validation: Use `requirementsSchema` (sql required)

### qa-agent-input.contract.ts
Defines the expected input structure for the QA agent:
- `qaAgentInputSchema`: Input state structure for QA processing
- `qaProcessingTestcaseSchema`: Testcase validation specific to QA SQL generation

**Note**: QA agent receives testcases with `title` and `type`, then generates `sql` for each testcase. Test execution is handled by a separate tool.

**Usage**: Validate QA agent input to ensure it receives properly structured testcases.

### state-schema.contract.ts
Defines the agent state structure with LangGraph annotations:
- `RequirementsStateAnnotation`: LangGraph annotation for requirements field
- `LegacyAnalyzedRequirementsAnnotation`: Temporary annotation for legacy field (Phase 1-2)
- Helper functions for state updates

**Usage**: Use in StateGraph definitions to ensure type-safe state transitions.

## Testing Contracts

All contracts should have corresponding test files that verify:
1. Valid data passes validation
2. Invalid data fails validation with clear error messages
3. Type inference works correctly
4. Edge cases are handled (empty arrays, missing optional fields, etc.)

## Migration Phases

### Phase 1: Contract Introduction
- All contracts are created
- Tests validate new schema structure
- Legacy field contracts remain for backward compatibility

### Phase 2: Contract Enforcement
- PM agent output validated against pm-agent-output.contract
- QA agent input validated against qa-agent-input.contract
- State updates validated against state-schema.contract

### Phase 3: Legacy Removal
- Remove `LegacyAnalyzedRequirementsAnnotation`
- Update contracts to remove all legacy field references
- Final validation that no legacy schema remains
