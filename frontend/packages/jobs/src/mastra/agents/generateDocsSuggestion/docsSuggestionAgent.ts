import { openai } from '@ai-sdk/openai'
import type { Metric } from '@mastra/core'
import { Agent, type ToolsInput } from '@mastra/core/agent'

// Common documentation structure description
export const DOCS_STRUCTURE_DESCRIPTION = `
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

// Create the agent
export const docsSuggestionAgent: Agent<
  'Documentation Suggestion Agent',
  ToolsInput,
  Record<string, Metric>
> = new Agent({
  name: 'Documentation Suggestion Agent',
  instructions: EVALUATION_SYSTEM_PROMPT,
  model: openai('o3-mini-2025-01-31'),
})
