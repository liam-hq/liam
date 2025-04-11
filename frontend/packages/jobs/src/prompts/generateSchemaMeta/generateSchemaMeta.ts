import type { Callbacks } from '@langchain/core/callbacks/manager'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { RunnableLambda } from '@langchain/core/runnables'
import { ChatOpenAI } from '@langchain/openai'
import {
  type DBOverride,
  type DBStructure,
  dbOverrideSchema,
} from '@liam-hq/db-structure'
import { toJsonSchema } from '@valibot/to-json-schema'
import { type InferOutput, boolean, object, parse, string } from 'valibot'

// Define evaluation schema using valibot
const evaluationSchema = object({
  updateNeeded: boolean(),
  reasoning: string(),
  suggestedChanges: string(),
})

// Convert schemas to JSON format for LLM
const evaluationJsonSchema = toJsonSchema(evaluationSchema)
const dbOverrideJsonSchema = toJsonSchema(dbOverrideSchema)

// Define type for evaluation result
type EvaluationResult = InferOutput<typeof evaluationSchema>

type GenerateSchemaMetaResult =
  | {
      updateNeeded: true
      override: DBOverride
      reasoning: string
    }
  | {
      updateNeeded: false
      reasoning: string
    }

// Step 1: Evaluation template to determine if updates are needed
const EVALUATION_TEMPLATE = ChatPromptTemplate.fromTemplate(`
You are Liam, an expert in database schema design and optimization.

## Your Task
Analyze the review comments and current schema metadata to determine if specific updates to schema metadata are necessary.

## Understanding Schema Metadata (IMPORTANT)
The schema-meta.json file is ONLY used for:
1. Adding informative comments to existing database tables and columns
2. Documenting relationships between existing tables
3. Grouping related tables together for better organization
4. Adding descriptive column metadata

schema-meta.json is NOT used for:
1. Defining database migrations or changes to actual schema structure
2. Creating migration safety mechanisms, rollbacks, or changesets
3. Addressing performance concerns or data integrity checks
4. Defining new tables or columns (only adds metadata to existing ones)

schema-meta.json is a documentation-only enhancement layer on top of the actual database schema.

## When to Update Schema Metadata
- If a table is removed from the actual schema, remove its references from schema-meta.json
- If a review comment suggests better documentation for a table's purpose, add a comment
- If tables are logically related but not grouped, create a table group
- If important relationships between tables are not documented, add them

## When NOT to Update Schema Metadata
- If comments mention migration procedures, rollbacks, or data integrity (irrelevant to metadata)
- If there are concerns about query performance or database operations
- If there's no clear suggestion to improve documentation or organization
- If the concern is about schema structure rather than its documentation

## Review Comment for Analysis
<comment>

{reviewComment}

</comment>

## Current Schema Metadata
<json>

{currentSchemaMeta}

</json>

## Current Database Structure
<json>

{dbStructure}

</json>

## Expected Output Format
Provide a JSON response with the following schema:

<json>

{evaluationJsonSchema}

</json>

The response must include:
- updateNeeded: Set to true ONLY if specific table documentation, relationships, or groupings need updating
- reasoning: A detailed explanation of your decision, focused on documentation needs
- suggestedChanges: If updates are needed, provide specific metadata changes (NOT schema structure changes)

## Guidelines for Evaluation
1. IGNORE any comments about migrations, rollbacks, performance, or data integrity - these are NOT relevant to schema-meta.json
2. Focus ONLY on improving table/column documentation and organization
3. Default to "updateNeeded: false" unless there is clear evidence that metadata documentation needs improvement
4. If a table has been removed from the schema (like GitHubDocFilePath), simply suggest removing it from schema-meta.json
5. Be conservative - schema-meta.json is for documentation purposes only
`)

// Step 2: Update template for generating schema updates
const UPDATE_TEMPLATE = ChatPromptTemplate.fromTemplate(`
You are Liam, an expert in database schema design and optimization for this project.

## Your Task
Create minimal, focused updates to the schema metadata based on the evaluation results.

## Schema Metadata Purpose (CRITICAL)
schema-meta.json is STRICTLY for documentation and organization:
1. Documentation: Adding descriptive comments to existing tables and columns
2. Relationships: Documenting logical connections between existing tables
3. Grouping: Organizing related tables into logical groups for better visualization

It is NOT for:
- Defining actual database schema changes or migrations
- Creating migration safety mechanisms or rollbacks
- Addressing performance concerns or data integrity

## Review Comment for Analysis
<comment>

{reviewComment}

</comment>

## Evaluation Results
<evaluationResults>

{evaluationResults}

</evaluationResults>

## Current Database Structure
<json>

{dbStructure}

</json>

## Current Schema Metadata
<json>

{currentSchemaMeta}

</json>

## Expected Output Format
Your response must strictly follow this JSON Schema and maintain the existing structure:
<json>

{dbOverrideJsonSchema}

</json>

## Guidelines for Updates (IMPORTANT)
1. PRESERVE ALL EXISTING METADATA unless explicitly replacing or removing it
2. If a table has been removed from the schema (like GitHubDocFilePath), remove all references to it from schema-meta.json
3. ONLY focus on documentation and organization, not on actual schema changes
4. Keep the same structure and format as the existing schema metadata
5. Only add/modify sections that need changes based on documentation needs
6. If adding new table groups, ensure they contain only existing tables
7. Do not create empty objects - remove sections entirely if they become empty

## Update Patterns
1. Removing a deleted table from a table group: If tables have been removed from the schema, remove them from any tableGroups where they appear.

2. Adding a comment to an existing table: Only add table comments that provide meaningful context about the table's purpose or usage.

3. Adding a relationship that documents a logical connection: Only document relationships between existing tables with correct column references.

REMEMBER: schema-meta.json is ONLY for documentation and organization purposes, NOT for actual database structure changes.
`)

export const generateSchemaMeta = async (
  reviewComment: string,
  callbacks: Callbacks,
  currentSchemaMeta: DBOverride | null,
  runId: string,
  dbStructure: DBStructure,
): Promise<GenerateSchemaMetaResult> => {
  const evaluationModel = new ChatOpenAI({
    model: 'o3-mini-2025-01-31',
  })

  const updateModel = new ChatOpenAI({
    model: 'o3-mini-2025-01-31',
  })

  // Create evaluation chain
  const evaluationChain = EVALUATION_TEMPLATE.pipe(
    evaluationModel.withStructuredOutput(evaluationJsonSchema),
  )

  // Create update chain
  const updateChain = UPDATE_TEMPLATE.pipe(
    updateModel.withStructuredOutput(dbOverrideJsonSchema),
  )

  // Define input types for our templates
  type EvaluationInput = {
    reviewComment: string
    currentSchemaMeta: string
    dbStructure: string
  }

  type UpdateInput = EvaluationInput & {
    evaluationResults: string
    dbOverrideJsonSchema: string
  }

  // Create a router function that returns different runnables based on evaluation
  const schemaMetaRouter = async (
    inputs: EvaluationInput & { dbOverrideJsonSchema: string },
    config?: { callbacks?: Callbacks; runId?: string; tags?: string[] },
  ): Promise<GenerateSchemaMetaResult> => {
    // First, run the evaluation chain
    const evaluationResult: EvaluationResult = await evaluationChain.invoke(
      {
        reviewComment: inputs.reviewComment,
        currentSchemaMeta: inputs.currentSchemaMeta,
        dbStructure: inputs.dbStructure,
        evaluationJsonSchema: JSON.stringify(evaluationJsonSchema, null, 2),
      },
      config,
    )

    if (evaluationResult.updateNeeded) {
      // Update is needed, generate new schema metadata
      const updateInput: UpdateInput = {
        reviewComment: inputs.reviewComment,
        currentSchemaMeta: inputs.currentSchemaMeta,
        dbStructure: inputs.dbStructure,
        dbOverrideJsonSchema: inputs.dbOverrideJsonSchema,
        evaluationResults: evaluationResult.suggestedChanges,
      }

      const updateResult = await updateChain.invoke(updateInput, {
        callbacks,
        runId,
        tags: ['generateSchemaMeta'],
      })

      // Parse the result and add the reasoning from the evaluation
      const parsedResult = parse(dbOverrideSchema, updateResult)

      // Return the result with the new structure
      return {
        updateNeeded: true,
        override: parsedResult,
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

  // Create the router chain using RunnableLambda
  const routerChain = new RunnableLambda({
    func: schemaMetaRouter,
  })

  try {
    // Prepare the common inputs
    const commonInputs = {
      reviewComment,
      dbStructure: JSON.stringify(dbStructure, null, 2),
      currentSchemaMeta: currentSchemaMeta
        ? JSON.stringify(currentSchemaMeta, null, 2)
        : '{}',
      dbOverrideJsonSchema: JSON.stringify(dbOverrideJsonSchema, null, 2),
      evaluationJsonSchema: JSON.stringify(evaluationJsonSchema, null, 2),
    }

    // Execute the router chain
    return await routerChain.invoke(commonInputs, {
      callbacks,
      runId,
      tags: ['generateSchemaMeta'],
    })
  } catch (error) {
    console.error('Error generating schema meta:', error)
    throw error
  }
}
