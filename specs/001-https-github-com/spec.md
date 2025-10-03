# Feature Specification: AnalyzedRequirements Schema Migration

**Feature Branch**: `001-https-github-com`
**Created**: 2025-10-03
**Status**: Ready
**Input**: User description: "https://github.com/liam-hq/liam/pull/3666 で検証し、analyzedRequirementsのschemaをbusinessRequirementからgoalとtestcasesに移行するのは生成品質の向上に寄与すると判断した。本実装を進めたい"

## Execution Flow (main)
```
1. Parse user description from Input
   → If empty: ERROR "No feature description provided"
2. Extract key concepts from description
   → Identify: actors, actions, data, constraints
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → If no clear user flow: ERROR "Cannot determine user scenarios"
5. Generate Functional Requirements
   → Each requirement must be testable
   → Mark ambiguous requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
   → If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
   → If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation
When creating this spec from a user prompt:
1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make
2. **Don't guess**: If the prompt doesn't specify something (e.g., "login system" without auth method), mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
4. **Common underspecified areas**:
   - User types and permissions
   - Data retention/deletion policies
   - Performance targets and scale
   - Error handling behaviors
   - Integration requirements
   - Security/compliance needs

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a PM or QA agent, I need to work with a simplified requirements schema that centers on goals and test cases, so that I can generate higher quality SQL test cases with clearer traceability from business objectives to concrete test scenarios.

### Acceptance Scenarios
1. **Given** the migration begins, **When** a new `requirements` field is created, **Then** the field contains `goal` and `testcases` structure for new schema
2. **Given** a PM agent has analyzed user requirements, **When** the agent generates requirements, **Then** the output uses the new `requirements` field with `goal` instead of `businessRequirement`
3. **Given** a PM agent needs to specify test cases, **When** the agent generates test scenarios, **Then** the output uses `testcases` array instead of `functionalRequirements` with structured test case records
4. **Given** all processing logic has been migrated to use `requirements` field, **When** the migration is complete, **Then** the old `analyzedRequirements` field is removed
5. **Given** a QA agent receives requirements, **When** the agent processes test case generation, **Then** the agent can access structured testcase data including title, type (INSERT/UPDATE/DELETE/SELECT), sql, and testResults
6. **Given** the system needs to route data between PM and QA agents, **When** the routing logic processes requirements, **Then** the data flow is simplified and centered on goals and test cases

### Edge Cases
- What happens when a goal is too broad or vague to map to concrete test cases?
- What validation is performed on testcase type values to ensure they are valid SQL operation types?

## Requirements *(mandatory)*

### Functional Requirements

**Phase 1: New Field Creation**
- **FR-001**: System MUST create a new `requirements` field alongside existing `analyzedRequirements` field
- **FR-002**: System MUST structure `requirements` field with `goal` (string) instead of `businessRequirement`
- **FR-003**: System MUST structure `requirements` field with `testcases` (array) instead of `functionalRequirements`
- **FR-004**: System MUST structure testcase records with the following fields: title, type (INSERT/UPDATE/DELETE/SELECT), sql, and testResults

**Phase 2: Migration to New Field**
- **FR-005**: System MUST update PM agent prompts to generate data in the new `requirements` field using goal-based terminology
- **FR-006**: System MUST update QA agent logic to consume the new `requirements.testcases` array structure
- **FR-007**: System MUST update routing logic to read from and write to the `requirements` field
- **FR-008**: System MUST validate testcase type field to ensure it contains only valid SQL operation types (INSERT, UPDATE, DELETE, SELECT)

**Phase 3: Legacy Field Removal**
- **FR-009**: System MUST remove the `analyzedRequirements` field after all processing logic has been migrated to use `requirements` field
- **FR-010**: System MUST ensure no backward compatibility is maintained for the old `analyzedRequirements` field

### Key Entities *(include if feature involves data)*
- **Requirements**: The new data structure containing goal (string) and testcases (array), replacing analyzedRequirements
- **AnalyzedRequirements** (legacy): The old data structure containing businessRequirement (string) and functionalRequirements (array), to be removed after migration
- **Testcase**: A structured record representing a test scenario with title (string), type (enum: INSERT/UPDATE/DELETE/SELECT), sql (string), and testResults (structure containing test execution results)
- **Goal**: A string field representing the primary business objective that drives test case generation

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---
