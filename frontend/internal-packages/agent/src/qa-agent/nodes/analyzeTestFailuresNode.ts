import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import * as v from 'valibot'
import type { AnalyzedRequirements } from '../../schemas/analyzedRequirements'
import { toJsonSchema } from '../../utils/jsonSchema'
import type { QaAgentState } from '../shared/qaAgentAnnotation'

const failureClassificationSchema = v.object({
  classifications: v.array(
    v.object({
      testcaseId: v.string(),
      issueType: v.union([v.literal('SQL_ISSUE'), v.literal('SCHEMA_ISSUE')]),
      reason: v.string(),
    }),
  ),
})

const model = new ChatOpenAI({
  model: 'o4-mini',
}).withStructuredOutput<v.InferOutput<typeof failureClassificationSchema>>(
  toJsonSchema(failureClassificationSchema),
)

const SYSTEM_PROMPT = `
You are a test failure analyzer. Your job is to classify test failures into SQL issues or schema issues.

CLASSIFICATION CRITERIA:

SQL_ISSUE - The SQL query itself is wrong:
- Syntax errors in SQL
- Wrong column references in existing tables
- Logical errors in queries
- Type mismatches in query values

SCHEMA_ISSUE - The database schema is incomplete:
- Table does not exist
- Column does not exist in a table
- Missing constraints (unique, foreign key, check)
- Missing indexes needed for the query

IMPORTANT: Analyze each error message carefully and classify based on root cause.
`

type FailedTestInfo = {
  testcaseId: string
  title: string
  sql: string
  errorMessage: string
}

const extractFailedTestsInfo = (
  analyzedRequirements: AnalyzedRequirements,
): FailedTestInfo[] => {
  const failedTests: FailedTestInfo[] = []

  for (const testcases of Object.values(analyzedRequirements.testcases)) {
    for (const testcase of testcases) {
      if (testcase.testResults.length === 0) continue

      const lastResult = testcase.testResults[testcase.testResults.length - 1]
      if (!lastResult) continue

      if (!lastResult.success) {
        failedTests.push({
          testcaseId: testcase.id,
          title: testcase.title,
          sql: testcase.sql,
          errorMessage: lastResult.message,
        })
      }
    }
  }

  return failedTests
}

const classifyFailures = async (
  failedTests: FailedTestInfo[],
): Promise<{ sqlIssueIds: string[]; schemaIssueIds: string[] }> => {
  if (failedTests.length === 0) {
    return { sqlIssueIds: [], schemaIssueIds: [] }
  }

  const failuresContext = failedTests
    .map(
      (test) => `
Test ID: ${test.testcaseId}
Title: ${test.title}
SQL: ${test.sql}
Error: ${test.errorMessage}
`,
    )
    .join('\n---\n')

  const contextMessage = `
Analyze these test failures and classify each one:

${failuresContext}

Classify each test failure as either SQL_ISSUE or SCHEMA_ISSUE.
`

  const result = await model.invoke([
    new SystemMessage(SYSTEM_PROMPT),
    new HumanMessage(contextMessage),
  ])

  const expectedIds = new Set(failedTests.map((test) => test.testcaseId))
  const seenIds = new Set<string>()
  const sqlIssueIds: string[] = []
  const schemaIssueIds: string[] = []

  for (const classification of result.classifications) {
    if (
      !expectedIds.has(classification.testcaseId) ||
      seenIds.has(classification.testcaseId)
    ) {
      continue
    }

    if (classification.issueType === 'SQL_ISSUE') {
      sqlIssueIds.push(classification.testcaseId)
    } else {
      schemaIssueIds.push(classification.testcaseId)
    }

    seenIds.add(classification.testcaseId)
  }

  // Fallback: treat any unclassified tests as SQL issues
  for (const testId of expectedIds) {
    if (!seenIds.has(testId)) {
      sqlIssueIds.push(testId)
    }
  }

  return { sqlIssueIds, schemaIssueIds }
}

/**
 * Analyzes test failures and classifies them into SQL issues or schema issues using LLM
 * @param state - QA agent state containing test results
 * @returns Updated state with failureAnalysis, or empty object if no failures
 */
export const analyzeTestFailuresNode = async (state: QaAgentState) => {
  const { analyzedRequirements } = state
  const failedTests = extractFailedTestsInfo(analyzedRequirements)

  if (failedTests.length === 0) {
    return {}
  }

  const { sqlIssueIds, schemaIssueIds } = await classifyFailures(failedTests)

  return {
    failureAnalysis: {
      failedSqlTestIds: sqlIssueIds,
      failedSchemaTestIds: schemaIssueIds,
    },
  }
}
