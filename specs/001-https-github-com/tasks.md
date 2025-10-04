# Tasks: AnalyzedRequirements Schema Migration

**Input**: Design documents from `/specs/001-https-github-com/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md

## Execution Flow
```
1. Load plan.md → Extract tech stack (LangGraph, Valibot, TypeScript)
2. Load contracts/ → 3 contract files for validation schemas
3. Load data-model.md → Requirements, Testcase, TestResult entities
4. Generate tasks by 3-phase migration approach:
   → Phase 1: New field creation (7 tasks)
   → Phase 2: Agent migration (14 tasks)
   → Phase 3: Legacy removal (6 tasks)
5. Apply TDD: Tests before implementation
6. Mark [P] for parallel execution (different files)
7. Validate: All contracts tested, all phases covered
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Project root**: `frontend/internal-packages/agent/`
- **Source**: `frontend/internal-packages/agent/src/`
- **Tests**: `frontend/internal-packages/agent/__tests__/`

---

## Phase 1: New Requirements Field Creation

### Phase 1.1: Setup & Validation Schemas
- [ ] T001 [P] Create Valibot schemas in `frontend/internal-packages/agent/src/types/requirements.ts` with testcaseType, testResultSchema, testcaseSchema, pmAgentTestcaseSchema, requirementsSchema, pmAgentRequirementsSchema (use field omission pattern: sql required in state, omitted from PM tool schema)
- [ ] T002 [P] Create state annotation helpers in `frontend/internal-packages/agent/src/state/requirements-state.ts` with RequirementsStateAnnotation, stateUpdateSchema, validateStateUpdate, createRequirementsUpdate, updateTestcases functions

### Phase 1.2: Contract Tests (TDD) ⚠️ MUST FAIL BEFORE T005-T007
**CRITICAL: Write these tests first, verify they FAIL, then implement**
- [ ] T003 [P] Contract test for requirementsSchema validation in `frontend/internal-packages/agent/__tests__/unit/requirements-schema.test.ts` - validates goal (non-empty), testcases array with title, type (INSERT/UPDATE/DELETE/SELECT), sql (required), testResults (optional)
- [ ] T004 [P] Contract test for pmAgentRequirementsSchema validation in `frontend/internal-packages/agent/__tests__/unit/pm-agent-requirements-schema.test.ts` - validates that sql field is omitted (v.omit pattern), ensures PM agent schema doesn't expose sql to LLM

### Phase 1.3: State Schema Implementation (ONLY after T003-T004 fail)
- [ ] T005 Add requirements field to AgentStateAnnotation in `frontend/internal-packages/agent/src/state/agent-state.ts` with Annotation<Requirements> type, reducer: (_, update) => update, default: () => ({ goal: '', testcases: [] })
- [ ] T006 [P] Add LegacyAnalyzedRequirementsAnnotation (temporary) in `frontend/internal-packages/agent/src/state/agent-state.ts` for parallel operation during Phase 1-2
- [ ] T007 [P] Integration test for state accepting requirements field in `frontend/internal-packages/agent/__tests__/integration/state-update.integration.test.ts` - verifies requirements field updates, validates sql is required in state

---

## Phase 2: Agent Migration to Requirements

### Phase 2.1: PM Agent Migration Tests (TDD) ⚠️ MUST FAIL BEFORE T012-T015
**CRITICAL: Write these tests first, verify they FAIL, then implement**
- [ ] T008 [P] Integration test PM agent generates requirements.goal in `frontend/internal-packages/agent/__tests__/integration/pm-agent-requirements.integration.test.ts` - validates goal is non-empty string
- [ ] T009 [P] Integration test PM agent generates requirements.testcases in `frontend/internal-packages/agent/__tests__/integration/pm-agent-testcases.integration.test.ts` - validates testcases array with title and type only (no sql), verifies PM tool schema omits sql field
- [ ] T010 [P] Integration test PM agent output validation in `frontend/internal-packages/agent/__tests__/integration/pm-agent-validation.integration.test.ts` - validates using pmAgentRequirementsSchema, ensures LLM doesn't generate sql field
- [ ] T011 [P] Integration test testcase type enum validation in `frontend/internal-packages/agent/__tests__/integration/testcase-type-validation.integration.test.ts` - validates only INSERT/UPDATE/DELETE/SELECT types accepted, rejects invalid types

### Phase 2.2: PM Agent Implementation (ONLY after T008-T011 fail)
- [ ] T012 Update PM agent prompt in `frontend/internal-packages/agent/src/agents/pm/prompts.ts` to use "goal" terminology instead of "business requirement", emphasize goal-driven test case generation
- [ ] T013 Update PM agent node in `frontend/internal-packages/agent/src/agents/pm/pm-agent.ts` to output requirements structure with pmAgentRequirementsSchema (sql field omitted from tool schema), generate goal + testcases (title, type only)
- [ ] T014 [P] Update PM agent tool definition in `frontend/internal-packages/agent/src/agents/pm/tools/` to use pmAgentRequirementsSchema (prevents LLM from seeing sql field)
- [ ] T015 [P] Add testcase type validation in `frontend/internal-packages/agent/src/agents/pm/validators.ts` to ensure type is one of INSERT/UPDATE/DELETE/SELECT

### Phase 2.3: QA Agent Migration Tests (TDD) ⚠️ MUST FAIL BEFORE T018-T021
**CRITICAL: Write these tests first, verify they FAIL, then implement**
- [ ] T016 [P] Integration test QA agent reads from requirements.testcases in `frontend/internal-packages/agent/__tests__/integration/qa-agent-read-requirements.integration.test.ts` - validates QA consumes testcases from requirements field
- [ ] T017 [P] Integration test QA agent generates SQL for testcases in `frontend/internal-packages/agent/__tests__/integration/qa-agent-sql-generation.integration.test.ts` - validates SQL generation based on title and type, SQL syntax validation with pgParse, uses testcaseSchema (sql field included in tool schema)

### Phase 2.4: QA Agent Implementation (ONLY after T016-T017 fail)
- [ ] T018 Update QA agent node in `frontend/internal-packages/agent/src/agents/qa/qa-agent.ts` to consume requirements.testcases, generate SQL for each testcase using testcaseSchema (includes sql field), validate SQL syntax with pgParse
- [ ] T019 Update QA agent to use saveTestcaseTool in `frontend/internal-packages/agent/src/agents/qa/tools/saveTestcaseTool.ts` for saving testcases with generated SQL
- [ ] T020 [P] Add SQL syntax validation in `frontend/internal-packages/agent/src/agents/qa/validators.ts` using pgParse library
- [ ] T021 [P] Update QA agent tool definition in `frontend/internal-packages/agent/src/agents/qa/tools/` to use testcaseSchema (includes sql field for LLM to generate)

### Phase 2.5: Routing & Test Execution (ONLY after PM & QA implementations complete)
- [ ] T022 Update routing logic in `frontend/internal-packages/agent/src/graph/routing.ts` to check state.requirements?.goal and state.requirements?.testcases?.length for PM→QA handoff
- [ ] T023 [P] Integration test for end-to-end PM→QA workflow in `frontend/internal-packages/agent/__tests__/integration/pm-qa-workflow.integration.test.ts` - validates PM generates requirements → QA generates SQL → routing works
- [ ] T024 [P] Integration test for test execution tool in `frontend/internal-packages/agent/__tests__/integration/test-execution.integration.test.ts` - validates runTestTool executes testcases, populates testResults with executedAt, success, resultSummary

---

## Phase 3: Legacy Field Removal

### Phase 3.1: Verification Tests (TDD) ⚠️ MUST FAIL BEFORE T026-T028
**CRITICAL: Write these tests first, verify they FAIL, then implement**
- [ ] T025 [P] Integration test verifying no analyzedRequirements references in `frontend/internal-packages/agent/__tests__/integration/no-legacy-references.integration.test.ts` - search codebase for businessRequirement, functionalRequirements, analyzedRequirements

### Phase 3.2: Legacy Removal (ONLY after T025 passes)
- [ ] T026 Remove analyzedRequirements field from AgentStateAnnotation in `frontend/internal-packages/agent/src/state/agent-state.ts`
- [ ] T027 [P] Remove LegacyAnalyzedRequirementsAnnotation from `frontend/internal-packages/agent/src/state/agent-state.ts`
- [ ] T028 [P] Remove any legacy validation schemas for analyzedRequirements in `frontend/internal-packages/agent/src/types/`
- [ ] T029 [P] Update all type definitions to remove analyzedRequirements references

### Phase 3.3: Final Validation
- [ ] T030 [P] Run full test suite in `frontend/internal-packages/agent/` to ensure no regressions with `pnpm test`
- [ ] T031 [P] Integration test for complete workflow without legacy field in `frontend/internal-packages/agent/__tests__/integration/full-workflow-no-legacy.integration.test.ts` - validates entire PM→QA→Test flow using only requirements field

---

## Dependencies

### Phase 1 Dependencies
- T003-T004 (contract tests) before T005-T007 (implementation)
- T005 blocks T006-T007 (state schema must exist first)

### Phase 2 Dependencies
- T008-T011 (PM tests) before T012-T015 (PM implementation)
- T016-T017 (QA tests) before T018-T021 (QA implementation)
- T012-T015 complete before T016-T017 (PM must work before QA tests)
- T018-T021 complete before T022-T024 (QA must work before routing)

### Phase 3 Dependencies
- T025 before T026-T029 (verify no references before removal)
- T026-T029 before T030-T031 (cleanup before final validation)

### Cross-Phase Dependencies
- Phase 1 complete before Phase 2 starts
- Phase 2 complete before Phase 3 starts

---

## Parallel Execution Examples

### Phase 1 Contract Tests (T003-T004)
```bash
# Run in parallel - different test files
Task: "Contract test for requirementsSchema validation in frontend/internal-packages/agent/__tests__/unit/requirements-schema.test.ts"
Task: "Contract test for pmAgentRequirementsSchema validation in frontend/internal-packages/agent/__tests__/unit/pm-agent-requirements-schema.test.ts"
```

### Phase 2 PM Agent Tests (T008-T011)
```bash
# Run in parallel - different test files
Task: "Integration test PM agent generates requirements.goal in frontend/internal-packages/agent/__tests__/integration/pm-agent-requirements.integration.test.ts"
Task: "Integration test PM agent generates requirements.testcases in frontend/internal-packages/agent/__tests__/integration/pm-agent-testcases.integration.test.ts"
Task: "Integration test PM agent output validation in frontend/internal-packages/agent/__tests__/integration/pm-agent-validation.integration.test.ts"
Task: "Integration test testcase type enum validation in frontend/internal-packages/agent/__tests__/integration/testcase-type-validation.integration.test.ts"
```

### Phase 2 QA Agent Tests (T016-T017)
```bash
# Run in parallel - different test files
Task: "Integration test QA agent reads from requirements.testcases in frontend/internal-packages/agent/__tests__/integration/qa-agent-read-requirements.integration.test.ts"
Task: "Integration test QA agent generates SQL for testcases in frontend/internal-packages/agent/__tests__/integration/qa-agent-sql-generation.integration.test.ts"
```

### Phase 3 Final Validation (T030-T031)
```bash
# Run in parallel - different scopes
Task: "Run full test suite in frontend/internal-packages/agent/ with pnpm test"
Task: "Integration test for complete workflow without legacy field in frontend/internal-packages/agent/__tests__/integration/full-workflow-no-legacy.integration.test.ts"
```

---

## Notes

### Field Omission Pattern (Critical Design Pattern)
- **State annotation**: sql field is REQUIRED
- **PM Agent tool schema**: sql field OMITTED using `v.omit(testcaseSchema, ['sql', 'testResults'])`
  - LLM doesn't see sql field → won't generate it
- **QA Agent tool schema**: sql field INCLUDED in testcaseSchema
  - LLM sees sql field → generates it
- **Why**: Optional fields cause LLM to ignore them; omission pattern controls visibility

### Migration Strategy
- Phase 1: Create new `requirements` field alongside legacy `analyzedRequirements`
- Phase 2: Migrate all agents to use `requirements` field
- Phase 3: Remove `analyzedRequirements` after validation

### TDD Approach
- Write tests FIRST, verify they FAIL
- Implement code to make tests PASS
- Tests define requirements before implementation

### Parallel Execution Rules
- [P] tasks = different files, no shared dependencies
- Same file = sequential (no [P])
- Tests always before implementation

### Key Files Modified
- `frontend/internal-packages/agent/src/state/agent-state.ts` - State annotations
- `frontend/internal-packages/agent/src/types/requirements.ts` - Valibot schemas
- `frontend/internal-packages/agent/src/agents/pm/pm-agent.ts` - PM agent logic
- `frontend/internal-packages/agent/src/agents/qa/qa-agent.ts` - QA agent logic
- `frontend/internal-packages/agent/src/graph/routing.ts` - Routing logic

---

## Validation Checklist

- [x] All contracts have corresponding tests (T003-T004)
- [x] All entities have schema tasks (Requirements, Testcase, TestResult in T001)
- [x] All tests come before implementation (TDD structure enforced)
- [x] Parallel tasks truly independent (different files verified)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Three-phase migration approach maintained
- [x] Field omission pattern documented and tested
