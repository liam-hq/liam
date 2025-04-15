import type { Callbacks } from '@langchain/core/callbacks/manager'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { RunnableLambda } from '@langchain/core/runnables'
import { ChatOpenAI } from '@langchain/openai'
import type { Schema } from '@liam-hq/db-structure'
import { getFileContent } from '@liam-hq/github'
import { logger, task } from '@trigger.dev/sdk/v3'
import { toJsonSchema } from '@valibot/to-json-schema'
import { v4 as uuidv4 } from 'uuid'
import {
  type InferOutput,
  boolean,
  object,
  optional,
  parse,
  string,
} from 'valibot'
import { langfuseLangchainHandler } from '../../functions/langfuseLangchainHandler'
import { createClient } from '../../libs/supabase'
import { fetchSchemaInfoWithOverrides } from '../../utils/schemaUtils'
import { createKnowledgeSuggestionTask } from './createKnowledgeSuggestion'

// Define a common evaluation object structure
const fileEvaluationSchema = object({
  updateNeeded: boolean(),
  reasoning: string(),
  suggestedChanges: string(),
})

// Evaluation schema to determine which files need updates
export const evaluationSchema = object({
  schemaPatterns: fileEvaluationSchema,
  schemaContext: fileEvaluationSchema,
  migrationPatterns: fileEvaluationSchema,
  migrationOpsContext: fileEvaluationSchema,
})

// Define a file content with reasoning structure that can be reused
export const fileContentSchema = object({
  content: string(),
  reasoning: string(),
})

// Updated schema with optional fields that include content and reasoning
export const docsSuggestionSchema = object({
  schemaPatterns: optional(string()),
  schemaContext: optional(string()),
  migrationPatterns: optional(string()),
  migrationOpsContext: optional(string()),
})

// Define types for easier usage
export type EvaluationResult = InferOutput<typeof evaluationSchema>
export type FileContent = InferOutput<typeof fileContentSchema>
export type DocsSuggestion = InferOutput<typeof docsSuggestionSchema>
export type DocFileContentMap = Record<string, FileContent>

export const DOC_FILES = [
  'schemaPatterns.md',
  'schemaContext.md',
  'migrationPatterns.md',
  'migrationOpsContext.md',
] as const

export type DocFile = (typeof DOC_FILES)[number]

export type GenerateDocsSuggestionPayload = {
  reviewComment: string
  projectId: number
  pullRequestNumber: number
  owner: string
  name: string
  installationId: number
  type: 'DOCS'
  branchName: string
  overallReviewId: number
}

// Common documentation structure description
const DOCS_STRUCTURE_DESCRIPTION = `
The following files may need to be maintained:

schemaPatterns.md:
- Reusable patterns and rules for database schema design
- Structural modeling patterns, naming conventions, preferred types
- Canonical design choices specific to this project

schemaContext.md:
- Project-specific constraints that shape schema design
- Technical assumptions, ORM limitations, domain modeling needs
- Only schema-wide policies (no specific fields/models)

migrationPatterns.md:
- Safe and consistent migration strategies
- Sequencing rules, rollout patterns, reversibility requirements
- Implementation standards for this project

migrationOpsContext.md:
- Operational constraints on executing migrations
- Timing, tooling, deployment risks, safety strategies
`

export async function processGenerateDocsSuggestion(payload: {
  reviewComment: string
  projectId: number
  branchOrCommit?: string
}): Promise<{
  suggestions: Record<DocFile, FileContent>
  traceId: string
}> {
  try {
    const supabase = createClient()

    // Get repository information from supabase
    const { data: projectRepo, error } = await supabase
      .from('ProjectRepositoryMapping')
      .select(`
        *,
        repository:Repository(*)
      `)
      .eq('projectId', payload.projectId)
      .limit(1)
      .maybeSingle()

    if (error || !projectRepo?.repository) {
      throw new Error('Repository information not found')
    }

    const { repository } = projectRepo
    const repositoryFullName = `${repository.owner}/${repository.name}`
    const branch = payload.branchOrCommit || 'main'

    // Fetch all doc files from GitHub
    const docsPromises = DOC_FILES.map(async (filename) => {
      const filePath = `docs/${filename}`
      try {
        const fileData = await getFileContent(
          repositoryFullName,
          filePath,
          branch,
          Number(repository.installationId),
        )

        return {
          id: filename,
          title: filename,
          content: fileData.content
            ? JSON.stringify(
                Buffer.from(fileData.content, 'base64').toString('utf-8'),
              ).slice(1, -1)
            : '',
        }
      } catch (error) {
        console.warn(`Could not fetch file ${filePath}: ${error}`)
        return {
          id: filename,
          title: filename,
          content: '',
        }
      }
    })

    const docsArray = await Promise.all(docsPromises)

    // Format docs array as structured markdown instead of raw JSON
    let formattedDocsContent = 'No existing docs found'

    if (docsArray.length > 0) {
      formattedDocsContent = docsArray
        .map((doc) => {
          return `<text>\n\n## ${doc.title}\n\n${doc.content || '*(No content)*'}\n\n</text>\n\n---\n`
        })
        .join('\n')
    }

    const predefinedRunId = uuidv4()
    const callbacks = [langfuseLangchainHandler]

    // Fetch schema information with overrides
    const { overriddenSchema } = await fetchSchemaInfoWithOverrides(
      payload.projectId,
      branch,
      repositoryFullName,
      Number(repository.installationId),
    )

    const result = await generateDocsSuggestion(
      payload.reviewComment,
      formattedDocsContent,
      callbacks,
      predefinedRunId,
      overriddenSchema,
    )

    const suggestions = Object.fromEntries(
      Object.entries(result)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => {
          // Handle file extensions consistently
          const newKey = key.endsWith('.md') ? key : `${key}.md`
          return [newKey, value]
        }),
    ) as Record<DocFile, FileContent>

    // Return a properly structured object
    return {
      suggestions,
      traceId: predefinedRunId,
    }
  } catch (error) {
    console.error('Error generating docs suggestions:', error)
    throw error
  }
}

// Convert schemas to JSON format for LLM
const evaluationJsonSchema = toJsonSchema(evaluationSchema)
const docsSuggestionJsonSchema = toJsonSchema(docsSuggestionSchema)

// Common evaluation response structure for a single file
const fileEvaluationExample = {
  updateNeeded: 'true/false',
  reasoning: 'Detailed explanation of why this file needs to be updated or not',
  suggestedChanges:
    'If updates are needed, provide specific suggestions for what should be added or modified',
}

// Example evaluation response structure for the prompt
const evaluationResponseExample = {
  schemaPatterns: { ...fileEvaluationExample },
  schemaContext: { ...fileEvaluationExample },
  migrationPatterns: { ...fileEvaluationExample },
  migrationOpsContext: { ...fileEvaluationExample },
}

// Example update response structure for the prompt
const updateResponseExample = {
  schemaPatterns: 'Full updated content for schemaPatterns.md',
  migrationPatterns: 'Full updated content for migrationPatterns.md',
}

// Step 1: Evaluation template to determine which files need updates
const EVALUATION_TEMPLATE = ChatPromptTemplate.fromTemplate(`
You are Liam, an expert in schema design and migration strategy for this project.

## Your Task
Analyze the migration review and determine which documentation files need to be updated.

## 📁 Documentation Structure
${DOCS_STRUCTURE_DESCRIPTION}

---

## Migration Review

<text>

{reviewResult}

</text>

## Current Documentation

<docs>

{formattedDocsContent}

</docs>

## Current Database Structure
<json>

{schema}

</json>

---

## Your Task
For each documentation file, determine if it needs to be updated based on the migration review.

Return your analysis as a JSON object with the following structure:
<json>

{evaluationResponseExampleJson}

</json>

Guidelines:
- Be conservative - only mark a file for update if there's clear evidence it needs changes
- Provide specific reasoning for each decision
- For files that need updates, include detailed suggestedChanges with specific content to add or modify
- Focus on project-specific insights that would improve documentation
- Consider if the migration review contains new patterns or constraints not already documented
`)

// Step 2: Update template for generating content for files that need updates
const UPDATE_TEMPLATE = ChatPromptTemplate.fromTemplate(`
You are Liam, an expert in schema design and migration strategy for this project.

## Your Task
Update only the documentation files that need changes based on the evaluation results.

## 📁 Documentation Structure
${DOCS_STRUCTURE_DESCRIPTION}

---

## Migration Review

<text>

{reviewResult}

</text>

## Current Documentation

<docs>

{formattedDocsContent}

</docs>

## Current Database Structure
<json>

{schema}

</json>

## Evaluation Results

<text>

{evaluationResults}

</text>

---

## Your Task
Generate updated content ONLY for the files that need changes according to the evaluation results.

Return your updates as a JSON object with the following structure:
<json>

{updateResponseExampleJson}

</json>

Guidelines:
- Only include files marked as needing updates in the evaluation results
- For each included file, provide the complete updated content
- Omit files that don't need changes
- Be precise and intentional in your updates
- Focus on reusable knowledge
- Maintain accuracy and clarity
`)

export const generateDocsSuggestion = async (
  reviewResult: string,
  formattedDocsContent: string,
  callbacks: Callbacks,
  predefinedRunId: string,
  schema: Schema,
): Promise<DocFileContentMap> => {
  const evaluationModel = new ChatOpenAI({
    model: 'o3-mini-2025-01-31',
  })

  const updateModel = new ChatOpenAI({
    model: 'o3-mini-2025-01-31',
  })

  // Convert example objects to JSON strings for template use
  const evaluationResponseExampleJson = JSON.stringify(
    evaluationResponseExample,
    null,
    2,
  )
  const updateResponseExampleJson = JSON.stringify(
    updateResponseExample,
    null,
    2,
  )

  // Create evaluation chain
  const evaluationChain = EVALUATION_TEMPLATE.pipe(
    evaluationModel.withStructuredOutput(evaluationJsonSchema),
  )

  // Create update chain
  const updateChain = UPDATE_TEMPLATE.pipe(
    updateModel.withStructuredOutput(docsSuggestionJsonSchema),
  )

  // Define input type for update step
  type UpdateInput = {
    reviewResult: string
    formattedDocsContent: string
    evaluationResults: string
    updateResponseExampleJson: string
    schema: string
  }

  // Helper function to collect suggested changes for files that need updates
  const collectSuggestedChanges = (
    evaluationResult: EvaluationResult,
  ): Record<string, string> => {
    const suggestedChanges: Record<string, string> = {}

    for (const [key, value] of Object.entries(evaluationResult)) {
      if (value.updateNeeded) {
        suggestedChanges[key] = value.suggestedChanges
      }
    }

    return suggestedChanges
  }

  // Helper function to combine content and reasoning
  const combineContentAndReasoning = (
    parsedResult: DocsSuggestion,
    evaluationResult: EvaluationResult,
  ): DocFileContentMap => {
    const result: DocFileContentMap = {}

    const evaluationKeys = Object.keys(evaluationResult) as Array<
      keyof EvaluationResult
    >

    for (const key of evaluationKeys) {
      if (key in parsedResult && parsedResult[key] && evaluationResult[key]) {
        result[key] = {
          content: parsedResult[key],
          reasoning: evaluationResult[key].reasoning,
        }
      }
    }

    return result
  }

  // Create a router function that returns different runnables based on evaluation
  const docsSuggestionRouter = async (
    inputs: {
      reviewResult: string
      formattedDocsContent: string
      evaluationResponseExampleJson: string
      updateResponseExampleJson: string
      schema: string
    },
    config?: { callbacks?: Callbacks; runId?: string; tags?: string[] },
  ): Promise<DocFileContentMap> => {
    // First, run the evaluation chain
    const evaluationResult: EvaluationResult = await evaluationChain.invoke(
      {
        reviewResult: inputs.reviewResult,
        formattedDocsContent: inputs.formattedDocsContent,
        evaluationResponseExampleJson: inputs.evaluationResponseExampleJson,
        schema: inputs.schema,
      },
      config,
    )

    // Collect suggested changes for files that need updates
    const suggestedChanges = collectSuggestedChanges(evaluationResult)

    // Updates are needed, generate new content for files that need changes
    const updateInput: UpdateInput = {
      reviewResult: inputs.reviewResult,
      formattedDocsContent: inputs.formattedDocsContent,
      evaluationResults: JSON.stringify(suggestedChanges, null, 2),
      updateResponseExampleJson: inputs.updateResponseExampleJson,
      schema: inputs.schema,
    }

    const updateResult = await updateChain.invoke(updateInput, {
      callbacks,
      runId: predefinedRunId,
      tags: ['generateDocsSuggestion'],
    })

    // Parse the result and combine content with reasoning
    const parsedResult = parse(docsSuggestionSchema, updateResult)
    return combineContentAndReasoning(parsedResult, evaluationResult)
  }

  // Create the router chain using RunnableLambda
  const routerChain = new RunnableLambda({
    func: docsSuggestionRouter,
  })

  // Prepare the inputs
  const inputs = {
    reviewResult,
    formattedDocsContent,
    evaluationResponseExampleJson,
    updateResponseExampleJson,
    schema: JSON.stringify(schema, null, 2),
  }

  // Execute the router chain
  return await routerChain.invoke(inputs, {
    callbacks,
    runId: predefinedRunId,
    tags: ['generateDocsSuggestion'],
  })
}

export const generateDocsSuggestionTask = task({
  id: 'generate-docs-suggestion',
  run: async (payload: GenerateDocsSuggestionPayload) => {
    const { suggestions, traceId } = await processGenerateDocsSuggestion({
      reviewComment: payload.reviewComment,
      projectId: payload.projectId,
      branchOrCommit: payload.branchName,
    })

    logger.log('Generated docs suggestions:', { suggestions, traceId })

    for (const key of DOC_FILES) {
      const suggestion = suggestions[key]
      if (!suggestion || !suggestion.content) {
        logger.warn(`No content found for suggestion key: ${key}`)
        continue
      }

      await createKnowledgeSuggestionTask.trigger({
        projectId: payload.projectId,
        type: payload.type,
        title: `Docs update from PR #${payload.pullRequestNumber}`,
        path: `docs/${key}`,
        content: suggestion.content,
        branch: payload.branchName,
        traceId,
        reasoning: suggestion.reasoning || '',
        overallReviewId: payload.overallReviewId,
      })
    }

    return { suggestions, traceId }
  },
})
