
# Implementation Plan: AnalyzedRequirements Schema Migration

**Branch**: `001-https-github-com` | **Date**: 2025-10-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-https-github-com/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Migrate analyzedRequirements schema from `businessRequirement`/`functionalRequirements` to `goal`/`testcases` structure. This migration improves generation quality by providing clearer semantics and better traceability between business objectives and test scenarios. The migration follows a three-phase approach: 1) Create new `requirements` field, 2) Migrate all processing to new field, 3) Remove legacy `analyzedRequirements` field.

**Key Design Pattern**: Field omission to control LLM behavior
- State annotation: `sql` field is required
- PM Agent tool schema: `sql` field omitted (v.omit) - prevents LLM from generating SQL
- QA Agent tool schema: `sql` field included - guides LLM to generate SQL

## Technical Context
**Language/Version**: TypeScript 5.9.2
**Primary Dependencies**: LangGraph 0.4.9, LangChain Core 0.3.73, OpenAI 0.6.9, Valibot (schema validation)
**Storage**: Agent state management via LangGraph checkpointers
**Testing**: Vitest with integration test suites for agents
**Target Platform**: Node.js (monorepo with Turborepo + pnpm)
**Project Type**: Monorepo with agent package at `frontend/internal-packages/agent`
**Performance Goals**: Sub-second agent routing (GPT-5-nano), optimized memory for long workflows
**Constraints**: Agent-first architecture, subgraph modularity required, type-safe state transitions
**Scale/Scope**: Multi-agent system (PM, DB, QA agents) with LangGraph orchestration

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Agent Architecture Compliance
- [x] **Agent-First Design**: ✅ Schema changes affect PM and QA agents with clear responsibilities - PM generates requirements, QA consumes testcases
- [x] **Domain Expertise**: ✅ PM agent owns requirements analysis (goal generation), QA agent owns test execution (testcase processing)
- [x] **No Generic Agents**: ✅ Maintains existing agent specialization - no new generic agents introduced

### LangGraph Implementation Standards
- [x] **Subgraph Modularity**: ✅ Changes update existing agent subgraphs (PM prompt updates, QA logic updates) - maintains modularity
- [x] **Independent Testing**: ✅ Agent package has dedicated test suites (vitest.config.ts, vitest.config.integration.ts)
- [x] **Internal Retry Policies**: ✅ Schema migration doesn't affect existing retry mechanisms in agent subgraphs
- [x] **State Annotations**: ✅ New schema uses typed structures (goal: string, testcases: array with typed records)

### Workflow Resilience
- [x] **Graceful Fallbacks**: ✅ Three-phase migration allows gradual rollout with coexistence period
- [x] **Real-time Progress**: ✅ No impact on existing progress streaming mechanisms
- [x] **Error Context**: ✅ Validation on testcase type field preserves error handling quality

### Integration Patterns
- [x] **Legacy Compatibility**: ✅ Phase 1 creates new field alongside legacy field for parallel operation
- [x] **Performance Targets**: ✅ Schema simplification reduces token usage, improves routing performance

**Initial Assessment**: ✅ PASS - All constitutional requirements met

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
frontend/internal-packages/agent/
├── src/
│   ├── agents/
│   │   ├── pm/              # PM agent (generates requirements)
│   │   └── qa/              # QA agent (processes testcases)
│   ├── state/               # State annotations and types
│   ├── graph/               # LangGraph workflow definitions
│   └── types/               # TypeScript type definitions
├── __tests__/
│   ├── integration/         # Integration tests for agents
│   └── unit/                # Unit tests for subgraphs
└── test-utils/              # Test utilities

frontend/packages/
└── (other packages unaffected by this change)
```

**Structure Decision**: Monorepo structure with agent package at `frontend/internal-packages/agent`. This is an internal package modification - no new packages created. Changes are isolated to agent state schemas, PM agent prompts, and QA agent logic within the existing agent package structure.

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh claude`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: ✅ data-model.md, /contracts/*, quickstart.md, CLAUDE.md updated

**Post-Design Constitution Re-check**: ✅ PASS
- Agent-First Design: Maintained - changes are schema updates to existing PM/QA agents
- Subgraph Modularity: Maintained - updates happen within existing agent subgraphs
- State Annotations: Enhanced - new typed annotations with Valibot validation
- Graceful Fallbacks: Improved - three-phase migration provides natural rollback points
- Legacy Compatibility: Ensured - Phase 1 maintains both fields for parallel operation

No constitutional violations introduced in Phase 1 design.

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
The /tasks command will generate tasks following the three-phase migration approach:

**Phase 1 Tasks - New Field Creation** (Tests → Implementation):
1. Contract test: Validate RequirementsSchema with Valibot [P]
2. Contract test: Validate TestcaseSchema with Valibot [P]
3. Contract test: Validate PM agent output contract [P]
4. Contract test: Validate QA agent input contract [P]
5. Implementation: Add requirements field to AgentStateAnnotation
6. Implementation: Create Valibot schemas for Requirements and Testcase
7. Integration test: Verify state accepts requirements field

**Phase 2 Tasks - Agent Migration** (Tests → Implementation):
8. Integration test: PM agent generates requirements.goal
9. Integration test: PM agent generates requirements.testcases array (title, type only)
10. Integration test: QA agent reads from requirements.testcases
11. Integration test: QA agent validates testcase types
12. Integration test: QA agent generates SQL for each testcase
13. Integration test: QA agent validates SQL syntax with pgParse
14. Implementation: Update PM agent prompts for goal generation
15. Implementation: Update PM agent to output requirements structure (no SQL)
16. Implementation: Update QA agent to consume requirements.testcases
17. Implementation: Update QA agent to generate SQL for testcases
18. Implementation: Add testcase type validation in QA agent
19. Implementation: Update routing logic to check requirements field
20. Integration test: End-to-end PM → QA workflow with requirements
21. Integration test: Test tool executes testcases and populates testResults

**Phase 3 Tasks - Legacy Removal** (Tests → Implementation):
22. Integration test: Verify no code references analyzedRequirements
23. Implementation: Remove analyzedRequirements from AgentStateAnnotation
24. Implementation: Remove legacy validation schemas
25. Implementation: Update all type definitions
26. Integration test: Full workflow without legacy field
27. Validation: Run all existing tests to ensure no regressions

**Ordering Strategy**:
- Three-phase sequence: Phase 1 complete → Phase 2 complete → Phase 3 complete
- Within each phase: Contract tests [P] → Implementation [P] → Integration tests
- TDD approach: Tests define requirements before implementation
- Mark [P] for parallel execution within same task type

**Estimated Output**: ~27 numbered, dependency-ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) ✅
- [x] Phase 1: Design complete (/plan command) ✅
- [x] Phase 2: Task planning complete (/plan command - describe approach only) ✅
- [x] Phase 3: Tasks generated (/tasks command) ✅
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS ✅
- [x] Post-Design Constitution Check: PASS ✅
- [x] All NEEDS CLARIFICATION resolved ✅
- [x] Complexity deviations documented: N/A - No deviations ✅

**Deliverables Created**:
- ✅ research.md - Technical research and decisions
- ✅ data-model.md - Entity definitions and state schema
- ✅ contracts/pm-agent-output.contract.ts - PM agent output validation
- ✅ contracts/qa-agent-input.contract.ts - QA agent input validation
- ✅ contracts/state-schema.contract.ts - State annotations and helpers
- ✅ contracts/README.md - Contract documentation
- ✅ quickstart.md - Step-by-step implementation guide
- ✅ CLAUDE.md - Updated agent context file
- ✅ plan.md - This implementation plan
- ✅ tasks.md - Implementation tasks (31 tasks, 3-phase migration)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
