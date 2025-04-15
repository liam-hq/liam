import type { Callbacks } from '@langchain/core/callbacks/manager'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { RunnableLambda } from '@langchain/core/runnables'
import { ChatOpenAI } from '@langchain/openai'
import {
  type Schema,
  type SchemaOverride,
  schemaOverrideSchema,
} from '@liam-hq/db-structure'
import { logger, task } from '@trigger.dev/sdk/v3'
import { toJsonSchema } from '@valibot/to-json-schema'
import { v4 as uuidv4 } from 'uuid'
import { type InferOutput, boolean, object, parse, string } from 'valibot'
import { SCHEMA_OVERRIDE_FILE_PATH } from '../../constants'
import { createClient } from '../../libs/supabase'
import { langfuseLangchainHandler } from '../../utils/langfuseLangchainHandler'
import { fetchSchemaInfoWithOverrides } from '../../utils/schemaUtils'
import { createKnowledgeSuggestionTask } from './createKnowledgeSuggestion'

// Define evaluation schema using valibot
const evaluationSchema = object({
  updateNeeded: boolean(),
  reasoning: string(),
  suggestedChanges: string(),
})

// Define type for evaluation result
type EvaluationResult = InferOutput<typeof evaluationSchema>

export type GenerateSchemaMetaPayload = {
  overallReviewId: number
}

export type SchemaMetaResult =
  | {
      createNeeded: true
      override: SchemaOverride
      projectId: number
      pullRequestNumber: number
      branchName: string
      title: string
      traceId: string
      overallReviewId: number
      reasoning?: string
    }
  | {
      createNeeded: false
    }

export const processGenerateSchemaMeta = async (
  payload: GenerateSchemaMetaPayload,
): Promise<SchemaMetaResult> => {
  try {
    const supabase = createClient()

    // Get the overall review from the database with nested relations
    const { data: overallReview, error } = await supabase
      .from('OverallReview')
      .select(`
        *,
        pullRequest:PullRequest(*,
          repository:Repository(*)
        ),
        project:Project(*)
      `)
      .eq('id', payload.overallReviewId)
      .single()

    if (error || !overallReview) {
      throw new Error(
        `Overall review with ID ${payload.overallReviewId} not found: ${JSON.stringify(error)}`,
      )
    }

    const { pullRequest, project } = overallReview
    if (!pullRequest) {
      throw new Error(
        `Pull request not found for overall review ${payload.overallReviewId}`,
      )
    }

    if (!project) {
      throw new Error(
        `Project not found for overall review ${payload.overallReviewId}`,
      )
    }

    const { repository } = pullRequest
    if (!repository) {
      throw new Error(`Repository not found for pull request ${pullRequest.id}`)
    }

    const predefinedRunId = uuidv4()
    const callbacks = [langfuseLangchainHandler]

    // Fetch schema information with overrides
    const repositoryFullName = `${repository.owner}/${repository.name}`
    const { currentSchemaMeta, overriddenSchema } =
      await fetchSchemaInfoWithOverrides(
        Number(project.id),
        overallReview.branchName,
        repositoryFullName,
        Number(repository.installationId),
      )

    const schemaMetaResult = await generateSchemaMeta(
      overallReview.reviewComment || '',
      callbacks,
      currentSchemaMeta,
      predefinedRunId,
      overriddenSchema,
    )

    // If no update is needed, return early with createNeeded: false
    if (!schemaMetaResult.updateNeeded) {
      return {
        createNeeded: false,
      }
    }

    // Return the schema meta along with information needed for createKnowledgeSuggestionTask
    return {
      createNeeded: true,
      override: schemaMetaResult.override,
      projectId: project.id,
      pullRequestNumber: Number(pullRequest.pullNumber), // Convert bigint to number
      branchName: overallReview.branchName, // Get branchName from overallReview
      title: `Schema meta update from PR #${Number(pullRequest.pullNumber)}`,
      traceId: predefinedRunId,
      reasoning: schemaMetaResult.reasoning,
      overallReviewId: payload.overallReviewId,
    }
  } catch (error) {
    console.error('Error generating schema meta:', error)
    throw error
  }
}

// Convert schemas to JSON format for LLM
const evaluationJsonSchema = toJsonSchema(evaluationSchema)
const schemaOverrideJsonSchema = toJsonSchema(schemaOverrideSchema)

// Step 1: Evaluation template to determine if updates are needed
const EVALUATION_TEMPLATE = ChatPromptTemplate.fromTemplate(`
You are Liam, an expert in database schema design and optimization.

## Your Task
Analyze the review comments and current schema metadata to determine if specific updates to schema metadata are necessary.

## Understanding Schema Metadata (IMPORTANT)
The schema-override.yml file is ONLY used for:
1. Adding informative comments to existing database tables and columns
2. Documenting relationships between existing tables
3. Grouping related tables together for better organization
4. Adding descriptive column metadata

schema-override.yml is NOT used for:
1. Defining database migrations or changes to actual schema structure
2. Creating migration safety mechanisms, rollbacks, or changesets
3. Addressing performance concerns or data integrity checks
4. Defining new tables or columns (only adds metadata to existing ones)

schema-override.yml is a documentation-only enhancement layer on top of the actual database schema.

## When to Update Schema Metadata
- If a table is removed from the actual schema, remove its references from schema-override.yml
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
- suggestedChanges: If updates are needed, provide specific metadata changes (NOT schema structure changes)

## Guidelines for Evaluation
1. IGNORE any comments about migrations, rollbacks, performance, or data integrity - these are NOT relevant to schema-override.yml
2. Focus ONLY on improving table/column documentation and organization
3. Default to "updateNeeded: false" unless there is clear evidence that metadata documentation needs improvement
4. If a table has been removed from the schema (like GitHubDocFilePath), simply suggest removing it from schema-override.yml
5. Be conservative - schema-override.yml is for documentation purposes only
`)

// Step 2: Update template for generating schema updates
const UPDATE_TEMPLATE = ChatPromptTemplate.fromTemplate(`
You are Liam, an expert in database schema design and optimization for this project.

## Your Task
Create minimal, focused updates to the schema metadata based on the evaluation results.

## Schema Metadata Purpose (CRITICAL)
schema-override.yml is STRICTLY for documentation and organization:
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

{schema}

</json>

## Current Schema Metadata
<json>

{currentSchemaMeta}

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
4. Keep the same structure and format as the existing schema metadata
5. Only add/modify sections that need changes based on documentation needs
6. If adding new table groups, ensure they contain only existing tables
7. Do not create empty objects - remove sections entirely if they become empty

## Update Patterns
1. Removing a deleted table from a table group: If tables have been removed from the schema, remove them from any tableGroups where they appear.

2. Adding a comment to an existing table: Only add table comments that provide meaningful context about the table's purpose or usage.

3. Adding a relationship that documents a logical connection: Only document relationships between existing tables with correct column references.

REMEMBER: schema-override.yml is ONLY for documentation and organization purposes, NOT for actual database structure changes.
`)

export const generateSchemaMeta = async (
  reviewComment: string,
  callbacks: Callbacks,
  currentSchemaMeta: SchemaOverride | null,
  runId: string,
  schema: Schema,
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
    updateModel.withStructuredOutput(schemaOverrideJsonSchema),
  )

  // Define input types for our templates
  type EvaluationInput = {
    reviewComment: string
    currentSchemaMeta: string
    schema: string
  }

  type UpdateInput = EvaluationInput & {
    evaluationResults: string
    schemaOverrideJsonSchema: string
  }

  // Create a router function that returns different runnables based on evaluation
  const schemaMetaRouter = async (
    inputs: EvaluationInput & { schemaOverrideJsonSchema: string },
    config?: { callbacks?: Callbacks; runId?: string; tags?: string[] },
  ): Promise<GenerateSchemaMetaResult> => {
    // First, run the evaluation chain
    const evaluationResult: EvaluationResult = await evaluationChain.invoke(
      {
        reviewComment: inputs.reviewComment,
        currentSchemaMeta: inputs.currentSchemaMeta,
        schema: inputs.schema,
        evaluationJsonSchema: JSON.stringify(evaluationJsonSchema, null, 2),
      },
      config,
    )

    if (evaluationResult.updateNeeded) {
      // Update is needed, generate new schema metadata
      const updateInput: UpdateInput = {
        reviewComment: inputs.reviewComment,
        currentSchemaMeta: inputs.currentSchemaMeta,
        schema: inputs.schema,
        schemaOverrideJsonSchema: inputs.schemaOverrideJsonSchema,
        evaluationResults: evaluationResult.suggestedChanges,
      }

      const updateResult = await updateChain.invoke(updateInput, {
        callbacks,
        runId,
        tags: ['generateSchemaMeta'],
      })

      // Parse the result and add the reasoning from the evaluation
      const parsedResult = parse(schemaOverrideSchema, updateResult)

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
      schema: JSON.stringify(schema, null, 2),
      currentSchemaMeta: currentSchemaMeta
        ? JSON.stringify(currentSchemaMeta, null, 2)
        : '{}',
      schemaOverrideJsonSchema: JSON.stringify(
        schemaOverrideJsonSchema,
        null,
        2,
      ),
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

export type GenerateSchemaMetaResult =
  | {
      updateNeeded: true
      override: SchemaOverride
      reasoning: string
    }
  | {
      updateNeeded: false
      reasoning: string
    }

export const generateSchemaMetaSuggestionTask = task({
  id: 'generate-schema-meta-suggestion',
  run: async (payload: GenerateSchemaMetaPayload) => {
    logger.log('Executing schema meta suggestion task:', { payload })
    const result = await processGenerateSchemaMeta(payload)
    logger.info('Generated schema meta suggestion:', { result })

    if (result.createNeeded) {
      // Create a knowledge suggestion with the schema meta using the returned information
      await createKnowledgeSuggestionTask.trigger({
        projectId: result.projectId,
        type: 'SCHEMA',
        title: result.title,
        path: SCHEMA_OVERRIDE_FILE_PATH,
        content: JSON.stringify(result.override, null, 2),
        branch: result.branchName,
        traceId: result.traceId,
        reasoning: result.reasoning || '',
        overallReviewId: result.overallReviewId,
      })
      logger.info('Knowledge suggestion creation triggered')
    } else {
      logger.info(
        'No schema meta update needed, skipping knowledge suggestion creation',
      )
    }

    return { result }
  },
})
