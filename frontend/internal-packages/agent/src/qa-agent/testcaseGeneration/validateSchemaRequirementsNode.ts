import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { Command, END } from '@langchain/langgraph'
import { ChatOpenAI } from '@langchain/openai'
import { fromPromise } from '@liam-hq/neverthrow'
import { yamlSchemaDeparser } from '@liam-hq/schema'
import * as v from 'valibot'
import { toJsonSchema } from '../../utils/jsonSchema'
import type { testcaseAnnotation } from './testcaseAnnotation'

const validationResultSchema = v.object({
  status: v.picklist(['SUFFICIENT', 'INSUFFICIENT']),
  issueDescription: v.pipe(
    v.string(),
    v.description(
      'For SUFFICIENT: Brief explanation why schema is adequate. ' +
        'For INSUFFICIENT: What specific elements are missing from the schema.',
    ),
  ),
})

const model = new ChatOpenAI({
  model: 'o4-mini',
}).withStructuredOutput<v.InferOutput<typeof validationResultSchema>>(
  toJsonSchema(validationResultSchema),
)

const SYSTEM_PROMPT = `
You are a schema requirements validator. Your job is to quickly assess if a database schema can fulfill a testing requirement.

ANALYZE: Does the provided schema contain the necessary tables and columns to create meaningful test cases for the given requirement?

RESPOND with a structured result:
- status: "SUFFICIENT" if schema has necessary elements, "INSUFFICIENT" if missing key elements
- issueDescription:
  * If SUFFICIENT: Brief explanation of why the schema is adequate
  * If INSUFFICIENT: Specific description of what elements are missing

Be decisive and focus on what is missing, not how to design it. Do not suggest specific table structures or implementation details.
`

/**
 * Validate Schema Requirements Node
 * Quick pre-check to see if schema can fulfill the requirement before attempting test generation
 */
export async function validateSchemaRequirementsNode(
  state: typeof testcaseAnnotation.State,
): Promise<Command> {
  const { currentTestcase, schemaData, goal } = state

  const schemaContextResult = yamlSchemaDeparser(schemaData)
  if (schemaContextResult.isErr()) {
    throw schemaContextResult.error
  }
  const schemaContext = schemaContextResult.value

  const contextMessage = `
# Database Schema Context
${schemaContext}

# Test Case to Validate
Type: ${currentTestcase.testcase.type}
Category: ${currentTestcase.category}
Title: ${currentTestcase.testcase.title}
Session Goal: ${goal}

Can this schema fulfill this test case for SQL generation?
`

  const result = await fromPromise(
    model.invoke([
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage(contextMessage),
    ]),
  )

  if (result.isErr()) {
    throw result.error
  }

  const validationResult = result.value
  if (validationResult.status === 'SUFFICIENT') {
    return new Command({ goto: 'generateTestcase' })
  }

  const schemaIssue = {
    testcaseId: currentTestcase.testcase.id,
    description: validationResult.issueDescription,
  }

  const skipReason = {
    testcaseId: currentTestcase.testcase.id,
    reason: validationResult.issueDescription,
  }

  return new Command({
    update: {
      schemaIssues: [schemaIssue],
      skipReasons: [skipReason],
    },
    goto: END,
  })
}
