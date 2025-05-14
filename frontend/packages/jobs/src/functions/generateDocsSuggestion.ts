import { openai } from '@ai-sdk/openai'
import type { Schema } from '@liam-hq/db-structure'
import { Agent } from '@mastra/core/agent'
import { logger } from '@trigger.dev/sdk/v3'
import { toJsonSchema } from '@valibot/to-json-schema'
import type { JSONSchema7 } from 'json-schema'
import { parse } from 'valibot'
import { mastra } from '../mastra'
import { DOCS_STRUCTURE_DESCRIPTION } from '../mastra/agents/generateDocsSuggestion'
import type { Review } from '../types'
import {
  type DocFileContentMap,
  type DocsSuggestion,
  type EvaluationResult,
  docsSuggestionSchema,
  evaluationSchema,
} from './docsSuggestionSchema'

// Convert schemas to JSON format for LLM
const evaluationJsonSchema = toJsonSchema(evaluationSchema)
const docsSuggestionJsonSchema = toJsonSchema(docsSuggestionSchema)

// Example update response structure for the prompt
const updateResponseExample = {
  schemaPatterns: 'Full updated content for schemaPatterns.md',
  migrationPatterns: 'Full updated content for migrationPatterns.md',
}

// Helper to format review for the prompt
const formatReview = (review: Review): string => {
  const { bodyMarkdown, feedbacks } = review

  if (!feedbacks || feedbacks.length === 0) {
    return bodyMarkdown
  }

  const feedbackSections = feedbacks
    .map(
      (feedback) => `
## Feedback: ${feedback.kind}
**Severity:** ${feedback.severity}
**Description:** ${feedback.description}
**Suggestion:** ${feedback.suggestion}
${
  feedback.suggestionSnippets && feedback.suggestionSnippets.length > 0
    ? `
**Code Snippets:**
${feedback.suggestionSnippets
  .map(
    (snippet) => `
\`\`\`
File: ${snippet.filename}
${snippet.snippet}
\`\`\`
`,
  )
  .join('')}
`
    : ''
}
`,
    )
    .join('\n')

  return `
${bodyMarkdown}

# Detailed Feedback
${feedbackSections}
`
}

const EVALUATION_USER_PROMPT = `
## Migration Review

<text>

{reviewResult}

</text>

## Current Documentation

<docs>

{formattedDocsContent}

</docs>

## Current Schema
<json>

{schema}

</json>
`

// Step 2: Update template for generating content for files that need updates
const UPDATE_SYSTEM_PROMPT = `
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

## Current Schema
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
- For each included file, provide only the necessary changes, not a complete rewrite
- For issues marked as WARNING, make minimal changes that preserve existing content
- For issues marked as ERROR/CRITICAL, be more thorough but still try to preserve useful existing content
- Omit files that don't need changes
- Be precise and intentional in your updates
- Format changes to be easy to review and apply
- Focus on reusable knowledge
- Maintain accuracy and clarity
`

const UPDATE_USER_PROMPT = `
## Migration Review

<text>

{reviewResult}

</text>

## Current Documentation

<docs>

{formattedDocsContent}

</docs>

## Current Schema
<json>

{schema}

</json>

## Evaluation Results

<text>

{evaluationResults}

</text>
`

// Extract function to run the evaluation step
async function runEvaluationStep(
  formattedReviewResult: string,
  formattedDocsContent: string,
  schema: Schema,
): Promise<EvaluationResult> {
  const evaluationResponse = await mastra
    .getAgent('docsSuggestionAgent')
    .generate(
      [
        {
          role: 'user',
          content: EVALUATION_USER_PROMPT.replace(
            '{reviewResult}',
            formattedReviewResult,
          )
            .replace('{formattedDocsContent}', formattedDocsContent)
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

  return evaluationResult
}

// Extract function to run the update step
async function runUpdateStep(
  formattedReviewResult: string,
  formattedDocsContent: string,
  schema: Schema,
  suggestedChanges: Record<string, string>,
): Promise<DocsSuggestion> {
  // Convert example object to JSON string for template use
  const updateResponseExampleJson = JSON.stringify(
    updateResponseExample,
    null,
    2,
  )

  // Create instructions with the example JSON
  const instructions = UPDATE_SYSTEM_PROMPT.replace(
    '{updateResponseExampleJson}',
    updateResponseExampleJson,
  )

  // Generate new content for files that need changes
  const updateAgent = new Agent({
    name: 'Documentation Suggestion Update Agent',
    instructions,
    model: openai('o3-mini-2025-01-31'),
  })

  const updateResponse = await updateAgent.generate(
    [
      {
        role: 'user',
        content: UPDATE_USER_PROMPT.replace(
          '{reviewResult}',
          formattedReviewResult,
        )
          .replace('{formattedDocsContent}', formattedDocsContent)
          .replace('{schema}', JSON.stringify(schema, null, 2))
          .replace(
            '{evaluationResults}',
            JSON.stringify(suggestedChanges, null, 2),
          ),
      },
    ],
    {
      output: docsSuggestionJsonSchema as JSONSchema7,
    },
  )

  // Parse the update response
  const updateResult: DocsSuggestion = parse(
    docsSuggestionSchema,
    updateResponse.object,
  )

  return updateResult
}

// Process evaluation result to collect suggested changes
function collectSuggestedChanges(
  evaluationResult: EvaluationResult,
): Record<string, string> {
  const suggestedChanges: Record<string, string> = {}
  for (const [key, value] of Object.entries(evaluationResult)) {
    const typedValue = value as {
      updateNeeded: boolean
      suggestedChanges: string
    }
    if (typedValue.updateNeeded) {
      suggestedChanges[key] = typedValue.suggestedChanges
    }
  }
  return suggestedChanges
}

// Combine results from evaluation and update steps
function combineResults(
  evaluationResult: EvaluationResult,
  updateResult: DocsSuggestion,
): DocFileContentMap {
  const result: DocFileContentMap = {}
  const evaluationKeys = Object.keys(evaluationResult) as Array<string>

  for (const key of evaluationKeys) {
    if (key in updateResult && updateResult[key as keyof DocsSuggestion]) {
      const evalResult = evaluationResult[key as keyof EvaluationResult]
      if (evalResult) {
        const typedEvalResult = evalResult as {
          reasoning: string
          updateNeeded: boolean
          suggestedChanges: string
        }
        result[key] = {
          content: updateResult[key as keyof DocsSuggestion] as string,
          reasoning: typedEvalResult.reasoning,
        }
      }
    }
  }
  return result
}

export const generateDocsSuggestion = async (
  review: Review,
  formattedDocsContent: string,
  traceId: string,
  schema: Schema,
): Promise<DocFileContentMap> => {
  // Use traceId for telemetry or logging
  logger.log(`Starting docs suggestion generation with trace ID: ${traceId}`)
  const formattedReviewResult = formatReview(review)

  // Run evaluation step
  const evaluationResult = await runEvaluationStep(
    formattedReviewResult,
    formattedDocsContent,
    schema,
  )

  // Extract suggested changes
  const suggestedChanges = collectSuggestedChanges(evaluationResult)

  // Run update step
  const updateResult = await runUpdateStep(
    formattedReviewResult,
    formattedDocsContent,
    schema,
    suggestedChanges,
  )

  // Process and return the results
  return combineResults(evaluationResult, updateResult)
}
