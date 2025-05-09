import * as crypto from 'node:crypto'
import { openai } from '@ai-sdk/openai'
import {
  type Schema,
  type SchemaOverride,
  schemaOverrideSchema,
} from '@liam-hq/db-structure'
import { Agent } from '@mastra/core/agent'
import { toJsonSchema } from '@valibot/to-json-schema'
import type { JSONSchema7 } from 'json-schema'
import { type InferOutput, boolean, object, parse, string } from 'valibot'
import {
  createLangfuseGeneration,
  createLangfuseTrace,
} from '../../functions/langfuseHandler'

// Define evaluation schema using valibot
const evaluationSchema = object({
  updateNeeded: boolean(),
  reasoning: string(),
  suggestedChanges: string(),
})

// Convert schemas to JSON format for LLM
const evaluationJsonSchema = toJsonSchema(evaluationSchema)
const schemaOverrideJsonSchema = toJsonSchema(schemaOverrideSchema)

// Define type for evaluation result
type EvaluationResult = InferOutput<typeof evaluationSchema>

type GenerateSchemaOverrideResult =
  | {
      updateNeeded: true
      override: SchemaOverride
      reasoning: string
    }
  | {
      updateNeeded: false
      reasoning: string
    }

// Step 1: Evaluation template to determine if updates are needed
const EVALUATION_SYSTEM_PROMPT = `
You are Liam, an expert in database schema design and optimization.

## Your Task
Analyze the review comments and current schema override to determine if specific updates to schema override are necessary.

## Understanding Schema Override (IMPORTANT)
The schema-override.yml file is ONLY used for:
1. Adding informative comments to existing database tables and columns
2. Documenting relationships between existing tables
3. Grouping related tables together for better organization
4. Adding descriptive column override

schema-override.yml is NOT used for:
1. Defining database migrations or changes to actual schema structure
2. Creating migration safety mechanisms, rollbacks, or changesets
3. Addressing performance concerns or data integrity checks
4. Defining new tables or columns (only adds override to existing ones)

schema-override.yml is a documentation-only enhancement layer on top of the actual database schema.

## When to Update Schema Override
- If a table is removed from the actual schema, remove its references from schema-override.yml
- If a review comment suggests better documentation for a table's purpose, add a comment
- If tables are logically related but not grouped, create a table group
- If important relationships between tables are not documented, add them

## When NOT to Update Schema Override
- If comments mention migration procedures, rollbacks, or data integrity (irrelevant to schema override)
- If there are concerns about query performance or database operations
- If there's no clear suggestion to improve documentation or organization
- If the concern is about schema structure rather than its documentation
`

const EVALUATION_USER_PROMPT = `
## Review Comment for Analysis
<comment>

{reviewComment}

</comment>

## Current Schema Override
<json>

{currentSchemaOverride}

</json>

## Current Schema
<json>

{schema}

</json>

## Expected Output Format
Provide a JSON response with the following schema:

<json>

{evaluationJsonSchema}

</json>

The response must include:
- updateNeeded: Set to true ONLY if specific table documentation, relationships, or groupings need updating
- reasoning: A detailed explanation of your decision, focused on documentation needs
- suggestedChanges: If updates are needed, provide specific override changes (NOT schema structure changes)

## Guidelines for Evaluation
1. IGNORE any comments about migrations, rollbacks, performance, or data integrity - these are NOT relevant to schema-override.yml
2. Focus ONLY on improving table/column documentation and organization
3. Default to "updateNeeded: false" unless there is clear evidence that schema override documentation needs improvement
4. If a table has been removed from the schema (like GitHubDocFilePath), simply suggest removing it from schema-override.yml
5. Be conservative - schema-override.yml is for documentation purposes only
`

// Step 2: Update template for generating schema updates
const UPDATE_SYSTEM_PROMPT = `
You are Liam, an expert in database schema design and optimization for this project.

## Your Task
Create minimal, focused updates to the schema override based on the evaluation results.

## Schema Override Purpose (CRITICAL)
schema-override.yml is STRICTLY for documentation and organization:
1. Documentation: Adding descriptive comments to existing tables and columns
2. Relationships: Documenting logical connections between existing tables
3. Grouping: Organizing related tables into logical groups for better visualization

It is NOT for:
- Defining actual database schema changes or migrations
- Creating migration safety mechanisms or rollbacks
- Addressing performance concerns or data integrity
`

const UPDATE_USER_PROMPT = `
## Review Comment for Analysis
<comment>

{reviewComment}

</comment>

## Evaluation Results
<evaluationResults>

{evaluationResults}

</evaluationResults>

## Current Schema
<json>

{schema}

</json>

## Current Schema Override
<json>

{currentSchemaOverride}

</json>

## Expected Output Format
Your response must strictly follow this JSON Schema and maintain the existing structure:
<json>

{schemaOverrideJsonSchema}

</json>

## Guidelines for Updates (IMPORTANT)
1. PRESERVE ALL EXISTING METADATA unless explicitly replacing or removing it
2. If a table has been removed from the schema (like GitHubDocFilePath), remove all references to it from schema-override.yml
3. ONLY focus on documentation and organization, not on actual schema changes
4. Keep the same structure and format as the existing schema override
5. Only add/modify sections that need changes based on documentation needs
6. If adding new table groups, ensure they contain only existing tables
7. Do not create empty objects - remove sections entirely if they become empty

## Update Patterns
1. Removing a deleted table from a table group: If tables have been removed from the schema, remove them from any tableGroups where they appear.

2. Adding a comment to an existing table: Only add table comments that provide meaningful context about the table's purpose or usage.

3. Adding a relationship that documents a logical connection: Only document relationships between existing tables with correct column references.

REMEMBER: schema-override.yml is ONLY for documentation and organization purposes, NOT for actual schema changes.
`

// Function to execute the evaluation step
async function evaluateSchemaOverride(
  trace: ReturnType<typeof createLangfuseTrace>,
  reviewComment: string,
  currentSchemaOverride: SchemaOverride | null,
  schema: Schema,
): Promise<EvaluationResult> {
  const evaluationGeneration = createLangfuseGeneration(
    trace,
    'evaluateSchemaOverride',
    {
      reviewComment,
      currentSchemaOverride: currentSchemaOverride
        ? JSON.stringify(currentSchemaOverride, null, 2)
        : '{}',
      schema: JSON.stringify(schema, null, 2),
    },
    {
      model: 'o3-mini-2025-01-31',
      tags: ['generateSchemaOverride', 'evaluation'],
    },
  )

  try {
    // First, run the evaluation to determine if updates are needed
    const agent = new Agent({
      name: 'Schema Override Evaluation Agent',
      instructions: EVALUATION_SYSTEM_PROMPT,
      model: openai('o3-mini-2025-01-31'),
    })

    const evaluationResponse = await agent.generate(
      [
        {
          role: 'user',
          content: EVALUATION_USER_PROMPT.replace(
            '{reviewComment}',
            reviewComment,
          )
            .replace(
              '{currentSchemaOverride}',
              currentSchemaOverride
                ? JSON.stringify(currentSchemaOverride, null, 2)
                : '{}',
            )
            .replace('{schema}', JSON.stringify(schema, null, 2)),
        },
      ],
      {
        output: evaluationJsonSchema as JSONSchema7,
      },
    )

    // Parse the evaluation response
    const evaluationResult: EvaluationResult = parse(
      evaluationSchema,
      evaluationResponse.object,
    )

    evaluationGeneration.end({
      output: evaluationResult,
    })

    return evaluationResult
  } catch (error) {
    evaluationGeneration.end({
      output: { error: error instanceof Error ? error.message : String(error) },
    })

    throw error
  }
}

// Function to execute the update step
async function updateSchemaOverride(
  trace: ReturnType<typeof createLangfuseTrace>,
  reviewComment: string,
  currentSchemaOverride: SchemaOverride | null,
  schema: Schema,
  evaluationResult: EvaluationResult,
): Promise<SchemaOverride> {
  const updateGeneration = createLangfuseGeneration(
    trace,
    'updateSchemaOverride',
    {
      reviewComment,
      currentSchemaOverride: currentSchemaOverride
        ? JSON.stringify(currentSchemaOverride, null, 2)
        : '{}',
      schema: JSON.stringify(schema, null, 2),
      evaluationResults: evaluationResult.suggestedChanges,
    },
    {
      model: 'o3-mini-2025-01-31',
      tags: ['generateSchemaOverride', 'update'],
    },
  )

  try {
    const updateAgent = new Agent({
      name: 'Schema Override Update Agent',
      instructions: UPDATE_SYSTEM_PROMPT,
      model: openai('o3-mini-2025-01-31'),
    })

    const updateResponse = await updateAgent.generate(
      [
        {
          role: 'user',
          content: UPDATE_USER_PROMPT.replace('{reviewComment}', reviewComment)
            .replace(
              '{currentSchemaOverride}',
              currentSchemaOverride
                ? JSON.stringify(currentSchemaOverride, null, 2)
                : '{}',
            )
            .replace('{schema}', JSON.stringify(schema, null, 2))
            .replace('{evaluationResults}', evaluationResult.suggestedChanges),
        },
      ],
      {
        output: schemaOverrideJsonSchema as JSONSchema7,
      },
    )

    // Parse the update response
    const updateResult = parse(schemaOverrideSchema, updateResponse.object)

    updateGeneration.end({
      output: updateResult,
    })

    return updateResult
  } catch (error) {
    updateGeneration.end({
      output: {
        error: error instanceof Error ? error.message : String(error),
      },
    })

    throw error
  }
}

export const generateSchemaOverride = async (
  reviewComment: string,
  currentSchemaOverride: SchemaOverride | null,
  runId: string,
  schema: Schema,
): Promise<GenerateSchemaOverrideResult> => {
  // Create a trace ID if not provided
  const traceId = runId || crypto.randomUUID()

  // Create a trace for Langfuse
  const trace = createLangfuseTrace('generateSchemaOverride', {
    runId: traceId,
  })

  // Execute the evaluation step
  const evaluationResult = await evaluateSchemaOverride(
    trace,
    reviewComment,
    currentSchemaOverride,
    schema,
  )

  // Execute the update step if changes are needed
  if (evaluationResult.updateNeeded) {
    const updateResult = await updateSchemaOverride(
      trace,
      reviewComment,
      currentSchemaOverride,
      schema,
      evaluationResult,
    )

    return {
      updateNeeded: true,
      override: updateResult,
      reasoning: evaluationResult.reasoning,
    }
  }

  return {
    updateNeeded: false,
    reasoning:
      evaluationResult.reasoning ||
      'No updates needed based on the review comments.',
  }
}
