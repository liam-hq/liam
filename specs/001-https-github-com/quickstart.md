# Quickstart: AnalyzedRequirements Schema Migration

This guide demonstrates the complete schema migration from `analyzedRequirements` to `requirements` using the new goal/testcases structure.

## Prerequisites

```bash
cd frontend/internal-packages/agent
pnpm install
```

## Phase 1: Create New Requirements Field

### 1. Define State Schema with Requirements

```typescript
// src/state/agent-state.ts
import { Annotation } from '@langchain/langgraph';

export const AgentStateAnnotation = Annotation.Root({
  // ... existing fields

  // New requirements field (sql is required in state annotation)
  requirements: Annotation<{
    goal: string;
    testcases: Array<{
      title: string;
      type: 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT';
      sql: string; // Required in state
      testResults?: unknown;
    }>;
  }>({
    reducer: (_, update) => update,
    default: () => ({ goal: '', testcases: [] }),
  }),

  // Legacy field (temporary - Phase 1-2)
  analyzedRequirements: Annotation<{
    businessRequirement: string;
    functionalRequirements: unknown[];
  }>({
    reducer: (_, update) => update,
  }),
});
```

### 2. Create Validation Schemas

```typescript
// src/types/requirements.ts
import * as v from 'valibot';

export const testcaseTypeEnum = v.picklist(['INSERT', 'UPDATE', 'DELETE', 'SELECT']);

// Complete testcase schema (sql required in state)
export const testcaseSchema = v.object({
  title: v.string(),
  type: testcaseTypeEnum,
  sql: v.string(), // Required in state
  testResults: v.optional(v.unknown()),
});

// PM Agent testcase schema (sql omitted from tool schema)
export const pmAgentTestcaseSchema = v.omit(testcaseSchema, ['sql', 'testResults']);

// Complete requirements schema (with sql in testcases)
export const requirementsSchema = v.object({
  goal: v.string(),
  testcases: v.array(testcaseSchema),
});

// PM Agent requirements schema (sql omitted from testcases)
export const pmAgentRequirementsSchema = v.object({
  goal: v.string(),
  testcases: v.array(pmAgentTestcaseSchema),
});
```

### 3. Test New Schema

```bash
pnpm test src/state/agent-state.test.ts
```

Expected: All tests pass with new requirements field structure.

## Phase 2: Migrate Agent Logic

### 1. Update PM Agent to Generate Requirements

```typescript
// src/agents/pm/pm-agent.ts
import { v } from 'valibot';
import { pmAgentRequirementsSchema } from '../../types/requirements';

const pmAgentNode = async (state: typeof AgentStateAnnotation.State) => {
  // Generate goal and testcases (title and type only)
  const goal = await generateGoal(state);
  const testcases = await generateTestcases(goal); // Returns [{ title, type }]

  // Validate using PM Agent schema (sql field omitted from tool schema)
  // This prevents LLM from generating SQL
  const requirements = v.parse(pmAgentRequirementsSchema, {
    goal,
    testcases, // testcases have only title and type
  });

  return {
    requirements,
  };
};

// Note: PM Agent tool uses pmAgentRequirementsSchema which omits sql field
//       LLM doesn't see sql in the schema, so it won't try to generate it
```

### 2. Update QA Agent to Generate SQL for Testcases

```typescript
// src/agents/qa/qa-agent.ts
import { v } from 'valibot';
import { testcaseSchema } from '../../types/requirements';
import { saveTestcaseTool } from './tools/saveTestcaseTool';

const qaAgentNode = async (state: typeof AgentStateAnnotation.State) => {
  const { requirements } = state;

  // Validate testcases (should have title and type, but no SQL yet)
  const validTestcases = requirements.testcases.map((tc) =>
    v.parse(testcaseSchema, tc)
  );

  // Generate SQL for each testcase using LLM
  const testcasesWithSQL = await Promise.all(
    validTestcases.map(async (testcase) => {
      // LLM generates SQL based on testcase title and type
      const generatedSQL = await generateSQLForTestcase(testcase);

      // Validate SQL syntax
      await validateSQLSyntax(generatedSQL);

      return {
        ...testcase,
        sql: generatedSQL,
      };
    })
  );

  // Save testcases with SQL using saveTestcaseTool
  // (Tool will handle state updates via Command)
  return {
    requirements: {
      ...requirements,
      testcases: testcasesWithSQL,
    },
  };
};
```

### 3. Update Routing Logic

```typescript
// src/graph/routing.ts
const shouldRouteToQA = (state: typeof AgentStateAnnotation.State) => {
  // Check new requirements field
  const hasRequirements = state.requirements?.goal &&
                          state.requirements?.testcases?.length > 0;

  if (hasRequirements) {
    return 'qa_agent';
  }

  return END;
};
```

### 4. Test Agent Workflow

```bash
pnpm test:integration src/graph/__tests__/workflow.integration.test.ts
```

Expected: PM generates requirements → QA processes testcases successfully.

## Phase 3: Remove Legacy Field

### 1. Remove analyzedRequirements from State

```typescript
// src/state/agent-state.ts
export const AgentStateAnnotation = Annotation.Root({
  // ... other fields

  requirements: Annotation<{
    goal: string;
    testcases: Array<{
      title: string;
      type: 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT';
      sql: string;
      testResults?: unknown;
    }>;
  }>({
    reducer: (_, update) => update,
    default: () => ({ goal: '', testcases: [] }),
  }),

  // analyzedRequirements field REMOVED
});
```

### 2. Remove Legacy References

Search and remove all references:
```bash
# Find any remaining references
pnpm grep -r "analyzedRequirements" src/

# Find any remaining references to businessRequirement
pnpm grep -r "businessRequirement" src/

# Find any remaining references to functionalRequirements
pnpm grep -r "functionalRequirements" src/
```

### 3. Final Validation

```bash
# Run all tests
pnpm test

# Run integration tests
pnpm test:integration

# Type check
pnpm tsc --noEmit

# Lint
pnpm lint
```

Expected: All tests pass, no type errors, no lint errors.

## Validation Scenarios

### Scenario 1: PM Agent Generates Valid Requirements

**Given**: User provides input for requirements analysis
**When**: PM agent processes the input using pmAgentRequirementsSchema (sql field omitted)
**Then**: Output contains `requirements.goal` (non-empty string)
**And**: Output contains `requirements.testcases` (array of valid testcases)
**And**: Each testcase has `title` and `type` (valid SQL operation type)
**And**: SQL field is NOT in tool schema - LLM doesn't generate it
**Note**: PM agent tool uses pmAgentRequirementsSchema which omits sql field

### Scenario 2: QA Agent Generates SQL for Testcases

**Given**: PM agent has generated requirements with testcases (title, type only - no SQL)
**When**: QA agent processes the requirements using testcaseSchema (sql field included)
**Then**: QA agent reads from `requirements.testcases`
**And**: SQL field IS in tool schema - LLM sees it and generates SQL
**And**: Generates SQL for each testcase based on title and type
**And**: Validates SQL syntax using pgParse
**And**: Saves testcases with generated SQL
**And**: Returns updated requirements with SQL
**Note**: QA agent tool uses testcaseSchema which includes sql field

### Scenario 3: Test Tool Executes Testcases

**Given**: QA agent has generated SQL for all testcases
**When**: Test execution tool runs
**Then**: Tool executes DDL setup
**And**: Runs each testcase SQL operation
**And**: Populates `testResults` with execution logs
**And**: Returns updated testcases with test results

### Scenario 4: Invalid Testcase Type Rejected

**Given**: A testcase with invalid type "MERGE"
**When**: Validation runs
**Then**: Validation fails with clear error message
**And**: Error indicates valid types: INSERT, UPDATE, DELETE, SELECT

### Scenario 5: Routing Based on Requirements

**Given**: Agent state with populated requirements field
**When**: Routing logic evaluates next step
**Then**: Routes to QA agent if goal and testcases present
**And**: Routes to END if requirements incomplete

## Troubleshooting

### Issue: Type errors with requirements field
**Solution**: Ensure TypeScript version is 5.9.2 and regenerate types:
```bash
pnpm tsc --noEmit
```

### Issue: Validation fails for testcase type
**Solution**: Check that testcase.type is exactly one of: INSERT, UPDATE, DELETE, SELECT (uppercase)

### Issue: State not updating correctly
**Solution**: Verify reducer is `(_, update) => update` to use replace strategy

### Issue: Integration tests fail
**Solution**: Check that both PM and QA agents are using `requirements` field, not legacy `analyzedRequirements`

## Next Steps

After completing the quickstart:
1. Review the [data model documentation](./data-model.md)
2. Examine the [contracts](./contracts/) for detailed schemas
3. Run the full test suite to ensure no regressions
4. Monitor agent performance for any unexpected behavior
