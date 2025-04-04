import type { Callbacks } from '@langchain/core/callbacks/manager'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { ChatOpenAI } from '@langchain/openai'
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

- An array of identified issues in the "issues" field, each including:
  - "kind": The issue category, selected from:
    - Migration Safety
    - Data Integrity
    - Performance Impact
    - Project Rules Consistency
    - Security or Scalability
  - "severity": For each issue, assign a severity value. Use "CRITICAL" or "WARNING" if the item represents a problem, and "POSITIVE" if it does not indicate an issue.
  - "description": A clear and precise explanation of the issue.
  - "suggestion": Actionable recommendations for addressing the issue.
  - "suggestionPatches": An array of suggestionsPatches for each issue kind in the "suggestions" field, each including:
    - "filename": The filename of the file that needs to be patched.
    - "patch": The patch to the file changes to address the issue.
- An array of scores for each issue kind in the "scores" field, each including:
  - "kind": One of the issue categories listed above.
  - "value": A numeric score from 0 to 10, using a deduction-based approach:
    - Start with a perfect score of 10 (indicating no issues)
    - Deduct points based on the number and severity of issues identified:
      - CRITICAL issues: Deduct 2-4 points each
      - WARNING issues: Deduct 1-2 points each
      - No deductions for POSITIVE observations
    - Consider the cumulative impact of multiple issues
    - A score of 0-3 indicates critical, unfixable problems
    - A score of 4-6 indicates significant issues requiring attention
    - A score of 7-9 indicates minor issues or concerns
    - A score of 10 indicates perfect design with no issues
  - "reason": An explanation justifying the score provided, including what deductions were made and why. If no issues were found in a category, explicitly state that a score of 10 was given because no issues were identified.
- A concise summary in the "summary" field that:
  - Describes the migration changes in about 1 line
  - Highlights the most important issues or risks (if any exist); if no significant issues are found, highlight positive aspects of the migration instead
  - Is about 3 lines in total length
- A detailed and constructive overall review in the "bodyMarkdown" field.
  - The bodyMarkdown should be a markdown formatted string.

Evaluation Criteria Details:
- **Migration Safety:** Evaluates whether mechanisms are in place to ensure that all changes are atomically rolled back and system integrity is maintained even if migration operations (such as DDL operations and data migration) are interrupted or fail midway. This is a general safety indicator.
- **Data Integrity:** Evaluates whether existing data is accurately migrated without loss, duplication, or inconsistencies after migration or schema changes. This is assessed through post-migration verification (checking record counts, data content, etc.) as a general data quality indicator.
- **Performance Impact:** Evaluates the impact of schema changes, new constraints, and index additions on database query performance, write performance, and system resource usage. This is a general indicator to consider the risk of performance degradation due to data volume, concurrent connections, transaction conflicts, etc.
- **Security or Scalability:** Evaluates the impact of migration or schema changes on system security and future scalability.
  - **Security:** Includes risks such as storing sensitive information (passwords, etc.) in plain text or deficiencies in access control.
  - **Scalability:** Evaluates the potential for performance degradation due to large-scale data processing, query delays, transaction conflicts, database locks, etc., as the system expands. This is a general perspective for evaluation.
- **Project Rules Consistency:** This evaluation item represents project-specific requirements. Checks whether schema changes comply with project documents or existing schema rules (e.g., use of specific prefixes, naming conventions, etc.). If project-specific rules are not provided, this evaluation may be omitted.

Ensure your response strictly adheres to the provided JSON schema.
**Your output must be raw JSON only. Do not include any markdown code blocks or extraneous formatting.**
`

export const USER_PROMPT = `Pull Request Description:
{prDescription}

Pull Request Comments:
{prComments}

Documentation Context:
{docsContent}

Schema Files:
{schemaFiles}

File Changes:
{fileChanges}`

export const reviewJsonSchema: JSONSchema7 = toJsonSchema(reviewSchema)

export const generateReview = async (
  docsContent: string,
  schemaFiles: GenerateReviewPayload['schemaFiles'],
  fileChanges: GenerateReviewPayload['fileChanges'],
  prDescription: string,
  prComments: string,
  callbacks: Callbacks,
  runId: string,
) => {
  const chatPrompt = ChatPromptTemplate.fromMessages([
    ['system', SYSTEM_PROMPT],
    ['human', USER_PROMPT],
  ])

  const model = new ChatOpenAI({
    temperature: 0.7,
    model: 'gpt-4o-mini',
  })

  const chain = chatPrompt.pipe(model.withStructuredOutput(reviewJsonSchema))
  const response = await chain.invoke(
    {
      docsContent,
      schemaFiles,
      fileChanges,
      prDescription,
      prComments,
    },
    {
      callbacks,
      runId,
    },
  )
  const parsedResponse = parse(reviewSchema, response)
  return parsedResponse
}
