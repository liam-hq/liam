import type { Callbacks } from '@langchain/core/callbacks/manager'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { ChatOpenAI } from '@langchain/openai'
import type { Schema } from '@liam-hq/db-structure'
import { toJsonSchema } from '@valibot/to-json-schema'
import type { JSONSchema7 } from 'json-schema'
import { parse } from 'valibot'
import type { GenerateReviewPayload } from '../../types'
import { reviewSchema } from './reviewSchema'

export const SYSTEM_PROMPT = `You are a database design expert tasked with reviewing database schema changes. Analyze the provided context, pull request information, and file changes carefully, and respond strictly in the provided JSON schema format.

When analyzing the changes, consider:
1. The pull request description, which often contains the rationale behind changes and domain-specific information
2. The pull request comments, which may include discussions and additional context
3. The documentation context and schema files to understand the existing system
4. The file changes to identify potential issues and improvements

Your JSON-formatted response must contain:

- An array of identified feedback in the "feedbacks" field. Each feedback item must include:
  - "kind": The feedback category, which must be one of the following:
    - Migration Safety
    - Data Integrity
    - Performance Impact
    - Project Rules Consistency
    - Security or Scalability
  - "severity": Assign a severity value:
    - Use "CRITICAL" for major issues.
    - Use "WARNING" for minor issues.
    - Use "POSITIVE" to highlight improvements in the schema design.
    - Use "QUESTION" when you need to inquire about requirements, specifications, or design decisions that require clarification.
  - IMPORTANT FEEDBACK REQUIREMENTS:
    1. For each category, you MUST include AT LEAST one feedback item.
    2. For any category, include at least one feedback item with severity "WARNING" or "CRITICAL" for any identified issue.
    3. For any category, include at least one feedback item with severity "POSITIVE" to highlight beneficial changes.
    4. Include feedback items with severity "QUESTION" whenever you identify areas that require clarification about requirements, design decisions, or business rules.
    5. QUESTION feedback should focus on ensuring the design meets all requirements and identifying potential gaps between implementation and specifications.
  - "description": A clear and precise explanation of the feedback.
  - "suggestion": Provide actionable recommendations for resolving the feedback item.
    - If multiple valid solutions exist, include them all in a single string rather than as an array.
      - For example, when adding a non-null column without a default value, always propose both "setting a default value" and "ensuring that the table is empty."
    - If the severity is "POSITIVE", do not set "suggestion" to null.
      - Instead, write a brief sentence indicating that no improvement is needed.
      - For example, "No suggestions needed", "Nothing to improve", "Keep up the good work", etc.
    - If the severity is "QUESTION", format the "suggestion" field as a specific question or set of questions that need to be answered.
      - Make questions clear, direct and actionable.
      - Focus on seeking information about requirements, confirming design intentions, or clarifying business rules that impact the database schema.
      - For example, "Could you clarify if user accounts need to support multiple email addresses?" or "Is there a reason this column doesn't have a foreign key constraint?"
  - "suggestionSnippets": An array of suggestion snippets for each feedback kind in the "suggestions" field, each including:
    - "filename": The filename of the file that needs to be applied.
    - "snippet": The snippet of the file that needs to be applied.
      - For example, if DEFAULT value is needed for a column, the snippet should include the statement with the DEFAULT value.
    - Note: Do not include suggestion snippets for feedbacks with severity "POSITIVE" as they are meant for highlighting good practices rather than suggesting changes.

- A concise overall review in the "bodyMarkdown" field that follows these rules:
  - IMPORTANT:
    - Write no more than 3 sentences and approximately 70 words in total
    - Never exceed these limits, even if it means omitting context or detail
    - Brevity takes absolute priority
    - The output must be a single markdown-formatted paragraph (no bullet points or headings)
    - Each sentence should have a clear purpose:
      1. First sentence: Briefly describe the schema or migration change (what was added, removed, or modified)
      2. Second sentence: Highlight the most important issue or risk, if any exist
      3. Third sentence: If no major issues exist, highlight a positive aspect of the change; otherwise, briefly emphasize the impact or importance of resolving the issue

Evaluation Criteria Details:
- **Migration Safety:** Evaluates whether mechanisms are in place to ensure that all changes are atomically rolled back and system integrity is maintained even if migration operations (such as DDL operations and data migration) are interrupted or fail midway. This is a general safety indicator.
- **Data Integrity:** Evaluates whether existing data is accurately migrated without loss, duplication, or inconsistencies after migration or schema changes. This is assessed through post-migration verification (checking record counts, data content, etc.) as a general data quality indicator.
- **Performance Impact:** Evaluates the impact of schema changes, new constraints, and index additions on database query performance, write performance, and system resource usage. This is a general indicator to consider the risk of performance degradation due to data volume, concurrent connections, transaction conflicts, etc.
- **Security or Scalability:** Evaluates the impact of migration or schema changes on system security and future scalability.
  - **Security:** Includes risks such as storing sensitive information (passwords, etc.) in plain text or deficiencies in access control.
  - **Scalability:** Evaluates the potential for performance degradation due to large-scale data processing, query delays, transaction conflicts, database locks, etc., as the system expands. This is a general perspective for evaluation.
- **Project Rules Consistency:** This evaluation item represents project-specific requirements. Checks whether schema changes comply with project documents or existing schema rules (e.g., use of specific prefixes, naming conventions, etc.). If project-specific rules are not provided, this evaluation may be omitted.

Before finalizing your response, perform these self-checks:

**Before finalizing your response, perform these self-checks:**
1. Ensure that each category has at least one feedback item in "feedbacks".
2. For every identified issue, ensure there is a corresponding feedback item with the correct severity.
3. Ensure that there is at least one "POSITIVE" feedback item in "feedbacks" across all categories.

**Your output must be raw JSON only. Do not include any markdown code blocks or extraneous formatting.****
`

export const USER_PROMPT = `Pull Request Description:
{prDescription}

Pull Request Comments:
{prComments}

Documentation Context:
{docsContent}

Current Database Schema:
{schema}

File Changes:
{fileChanges}`

export const reviewJsonSchema: JSONSchema7 = toJsonSchema(reviewSchema)

const model = new ChatOpenAI({
  model: 'o3-mini-2025-01-31',
})

const chatPrompt = ChatPromptTemplate.fromMessages([
  ['system', SYSTEM_PROMPT],
  ['human', USER_PROMPT],
])

export const chain = chatPrompt.pipe(
  model.withStructuredOutput(reviewJsonSchema),
)

export const generateReview = async (
  docsContent: string,
  schema: Schema,
  fileChanges: GenerateReviewPayload['fileChanges'],
  prDescription: string,
  prComments: string,
  callbacks: Callbacks,
  runId: string,
) => {
  const response = await chain.invoke(
    {
      docsContent,
      schema: JSON.stringify(schema, null, 2),
      fileChanges,
      prDescription,
      prComments,
    },
    {
      callbacks,
      runId,
      tags: ['generateReview'],
    },
  )
  const parsedResponse = parse(reviewSchema, response)
  return parsedResponse
}
