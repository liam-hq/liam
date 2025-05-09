import * as crypto from 'node:crypto'
import { openai } from '@ai-sdk/openai'
import type { Schema } from '@liam-hq/db-structure'
import { Agent } from '@mastra/core/agent'
import type { JSONSchema7 } from 'json-schema'
import { parse } from 'valibot'
import {
  createLangfuseGeneration,
  createLangfuseTrace,
} from '../../functions/langfuseHandler'
import type { Review } from '../../types'
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

// Step 1: Evaluation template to determine which files need updates
const EVALUATION_SYSTEM_PROMPT = `
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

## Current Schema
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
- Consider the severity level of each feedback in the review
- For WARNING level issues, suggest minimal and focused changes
- For ERROR/CRITICAL level issues, be more thorough with your suggested changes
`

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

export const generateDocsSuggestion = async (
  review: Review,
  formattedDocsContent: string,
  predefinedRunId: string,
  schema: Schema,
): Promise<DocFileContentMap> => {
  // Create a trace ID if not provided
  const traceId = predefinedRunId || crypto.randomUUID()

  // Create a trace for Langfuse
  const trace = createLangfuseTrace('generateDocsSuggestion', {
    runId: traceId,
  })

  const formattedReviewResult = formatReview(review)

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

  // Create a generation for evaluation step
  const evaluationGeneration = createLangfuseGeneration(
    trace,
    'evaluateDocsSuggestion',
    {
      reviewResult: formattedReviewResult,
      formattedDocsContent,
      schema: JSON.stringify(schema, null, 2),
      evaluationResponseExampleJson,
    },
    {
      model: 'o3-mini-2025-01-31',
      tags: ['generateDocsSuggestion', 'evaluation'],
    },
  )

  try {
    // First, run the evaluation to determine which files need updates
    const agent = new Agent({
      name: 'Documentation Suggestion Evaluation Agent',
      instructions: EVALUATION_SYSTEM_PROMPT,
      model: openai('o3-mini-2025-01-31'),
    })

    const evaluationResponse = await agent.generate(
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
        output: evaluationSchema as JSONSchema7,
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

    // Collect suggested changes for files that need updates
    const suggestedChanges: Record<string, string> = {}
    for (const [key, value] of Object.entries(evaluationResult)) {
      if (value.updateNeeded) {
        suggestedChanges[key] = value.suggestedChanges
      }
    }

    // Create a generation for update step
    const updateGeneration = createLangfuseGeneration(
      trace,
      'updateDocsSuggestion',
      {
        reviewResult: formattedReviewResult,
        formattedDocsContent,
        schema: JSON.stringify(schema, null, 2),
        evaluationResults: JSON.stringify(suggestedChanges, null, 2),
        updateResponseExampleJson,
      },
      {
        model: 'o3-mini-2025-01-31',
        tags: ['generateDocsSuggestion', 'update'],
      },
    )

    try {
      // Generate new content for files that need changes
      const updateAgent = new Agent({
        name: 'Documentation Suggestion Update Agent',
        instructions: UPDATE_SYSTEM_PROMPT,
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
          output: docsSuggestionSchema as JSONSchema7,
        },
      )

      // Parse the update response
      const updateResult: DocsSuggestion = parse(
        docsSuggestionSchema,
        updateResponse.object,
      )

      updateGeneration.end({
        output: updateResult,
      })

      // Combine content with reasoning from evaluation
      const result: DocFileContentMap = {}
      const evaluationKeys = Object.keys(evaluationResult) as Array<
        keyof EvaluationResult
      >

      for (const key of evaluationKeys) {
        if (key in updateResult && updateResult[key] && evaluationResult[key]) {
          result[key] = {
            content: updateResult[key],
            reasoning: evaluationResult[key].reasoning,
          }
        }
      }

      return result
    } catch (error) {
      updateGeneration.end({
        output: {
          error: error instanceof Error ? error.message : String(error),
        },
      })

      throw error
    }
  } catch (error) {
    evaluationGeneration.end({
      output: { error: error instanceof Error ? error.message : String(error) },
    })

    throw error
  }
}
