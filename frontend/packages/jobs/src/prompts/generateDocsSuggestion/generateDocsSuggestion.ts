import type { Callbacks } from '@langchain/core/callbacks/manager'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { RunnableLambda } from '@langchain/core/runnables'
import { ChatOpenAI } from '@langchain/openai'
import { toJsonSchema } from '@valibot/to-json-schema'
import { parse } from 'valibot'
import {
  type DocFileContentMap,
  type DocsSuggestion,
  type EvaluationResult,
  docsSuggestionSchema,
  evaluationSchema,
} from './docsSuggestionSchema'

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
    },
    config?: { callbacks?: Callbacks; runId?: string; tags?: string[] },
  ): Promise<DocFileContentMap> => {
    // First, run the evaluation chain
    const evaluationResult: EvaluationResult = await evaluationChain.invoke(
      {
        reviewResult: inputs.reviewResult,
        formattedDocsContent: inputs.formattedDocsContent,
        evaluationResponseExampleJson: inputs.evaluationResponseExampleJson,
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
  }

  // Execute the router chain
  return await routerChain.invoke(inputs, {
    callbacks,
    runId: predefinedRunId,
    tags: ['generateDocsSuggestion'],
  })
}
