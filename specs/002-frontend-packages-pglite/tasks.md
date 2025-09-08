# Tasks: Move SQL Syntax Validation from Execution Time to DML Generation Time

**Input**: Design documents from `/specs/002-frontend-packages-pglite/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: TypeScript, LangGraph, pgParse, valibot
   → Structure: Frontend monorepo enhancement (no new projects)
2. Load design documents:
   → data-model.md: No new entities needed
   → contracts/tool-interface.md: Tool validation behavior
   → research.md: LangGraph error throwing pattern, direct pgParse usage
3. Generate tasks by category:
   → Setup: Dependencies and project structure
   → Tests: Tool contract tests, integration scenarios
   → Core: Tool enhancement, execution path simplification
   → Integration: End-to-end workflow validation
   → Polish: Error message consistency, performance validation
4. Apply TDD rules: Tests before implementation (CRITICAL)
5. Number tasks sequentially (T001, T002...)
6. Parallel marking: Different files = [P], same file = sequential
7. SUCCESS: 18 tasks ready for execution
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Monorepo structure**: `frontend/internal-packages/agent/`, `frontend/packages/pglite-server/`
- Tests in existing test directories within each package

## Phase 3.1: Setup
- [ ] T001 Navigate to frontend/internal-packages/agent and verify dependencies (`@liam-hq/schema/parser`, `@langchain/core`, `valibot`)
- [ ] T002 [P] Configure test environment for tool validation in frontend/internal-packages/agent
- [ ] T003 [P] Set up test utilities for pgParse error simulation

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests - Tool Validation Behavior
- [ ] T004 [P] Contract test: Valid SQL operations saved successfully
  - File: `frontend/internal-packages/agent/src/qa-agent/tools/__tests__/saveDmlOperationsTool.contract.test.ts`
  - Verify: Multiple valid SQL operations → all saved, success response
- [ ] T005 [P] Contract test: Invalid SQL operations rejected with clear errors
  - File: `frontend/internal-packages/agent/src/qa-agent/tools/__tests__/saveDmlOperationsTool.validation.test.ts`
  - Verify: Syntax error → Error thrown, no operations saved, clear error message

### Integration Tests - End-to-End Scenarios  
- [ ] T006 [P] Integration test: Valid SQL generation and execution flow
  - File: `frontend/internal-packages/agent/src/qa-agent/__tests__/validation-workflow.integration.test.ts`
  - Scenario: Generate valid DML → validate → save → execute without re-validation
- [ ] T007 [P] Integration test: Invalid SQL error handling and retry mechanism
  - File: `frontend/internal-packages/agent/src/qa-agent/__tests__/error-handling.integration.test.ts`
  - Scenario: Generate invalid SQL → validation fails → LangGraph retry → eventual success
- [ ] T008 [P] Integration test: Backward compatibility with existing operations
  - File: `frontend/packages/pglite-server/src/__tests__/backward-compatibility.integration.test.ts`
  - Scenario: Execute pre-existing DML operations without validation flags

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T009 Add pgParse validation to saveDmlOperationsTool
  - File: `frontend/internal-packages/agent/src/qa-agent/tools/saveDmlOperationsTool.ts`
  - Import pgParse, validate each SQL before saving, throw Error on validation failure
- [ ] T010 Make syntax checking optional in PGliteInstanceManager
  - File: `frontend/packages/pglite-server/src/PGliteInstanceManager.ts`
  - Add configuration flag for optional syntax checking, maintain fallback behavior
- [ ] T011 Add error message formatting utility for SQL syntax errors
  - File: `frontend/internal-packages/agent/src/shared/sqlErrorFormatter.ts`
  - Create consistent error formatting with SQL context and position information

## Phase 3.4: Integration
- [ ] T012 Verify LangGraph retry mechanism works with validation errors
  - Test that thrown Error triggers built-in retry logic correctly
- [ ] T013 Add structured logging for validation events
  - File: `frontend/internal-packages/agent/src/qa-agent/tools/saveDmlOperationsTool.ts`
  - Log validation success/failure events with SQL context
- [ ] T014 Update tool schema and type definitions if needed
  - Ensure existing schema works with new validation logic

## Phase 3.5: Polish
- [ ] T015 [P] Unit tests for SQL error formatting utility
  - File: `frontend/internal-packages/agent/src/shared/__tests__/sqlErrorFormatter.unit.test.ts`
  - Test error message clarity, SQL snippet extraction, position highlighting
- [ ] T016 [P] Performance validation: measure validation impact on DML generation
  - Create performance benchmark comparing before/after validation timing
- [ ] T017 [P] Update documentation: tool behavior and error handling patterns
  - File: `frontend/internal-packages/agent/README.md` or relevant docs
- [ ] T018 Execute quickstart validation scenarios
  - Run through all test scenarios from quickstart.md to verify end-to-end functionality

## Dependencies
- Setup (T001-T003) before everything else
- Tests (T004-T008) MUST come before implementation (T009-T011) - TDD CRITICAL
- T009 (tool enhancement) blocks T012 (retry mechanism verification)
- T011 (error formatter) blocks T015 (error formatter tests)
- Core implementation (T009-T011) before integration (T012-T014)
- Everything before polish (T015-T018)

## Parallel Example
```bash
# Phase 3.2: Launch contract tests together (different files)
Task: "Contract test valid SQL in saveDmlOperationsTool.contract.test.ts"
Task: "Contract test invalid SQL in saveDmlOperationsTool.validation.test.ts"
Task: "Integration test validation workflow"
Task: "Integration test error handling and retry"
Task: "Integration test backward compatibility"
```

## Notes
- **TDD CRITICAL**: All tests (T004-T008) MUST be written and MUST FAIL before starting implementation (T009)
- **[P] tasks**: Different files, no dependencies - can run simultaneously
- **Error Pattern**: Follow LangGraph pattern - throw Error for validation failures, let framework handle retry
- **No Schema Changes**: This is purely internal logic enhancement, existing schemas remain unchanged
- **Backward Compatibility**: Ensure existing DML operations continue working without modification

## Task Generation Rules Applied
1. **From Tool Contract**: T004-T005 for tool validation behavior
2. **From Integration Scenarios**: T006-T008 for end-to-end workflows  
3. **From Research Decisions**: T009 (direct pgParse), T010 (optional execution validation)
4. **TDD Ordering**: Tests before implementation strictly enforced
5. **Parallel Marking**: Different files marked [P], same file sequential

## Validation Checklist ✓
- [x] Tool contract has corresponding tests (T004-T005)
- [x] Integration scenarios have test tasks (T006-T008) 
- [x] All tests come before implementation (T004-T008 before T009-T011)
- [x] Parallel tasks are truly independent (different files)
- [x] Each task specifies exact file path
- [x] No [P] task modifies same file as another [P] task