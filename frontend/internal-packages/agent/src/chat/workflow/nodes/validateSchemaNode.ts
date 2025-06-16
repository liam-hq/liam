import { executeQuery } from '@liam-hq/pglite-server'
import { QAAgent } from '../../../langchain/agents'
import { convertSchemaToText } from '../../../utils/convertSchemaToText'
import type { WorkflowState } from '../types'

function extractDMLQueries(response: string): string[] {
  const queries: string[] = []
  const lines = response.split('\n')
  let currentQuery = ''
  let inQuery = false

  for (const line of lines) {
    const trimmedLine = line.trim()

    if (trimmedLine.match(/^(INSERT|UPDATE|DELETE|SELECT)\s+/i)) {
      if (currentQuery.trim()) {
        queries.push(currentQuery.trim())
      }
      currentQuery = line
      inQuery = true
    } else if (inQuery && trimmedLine.endsWith(';')) {
      currentQuery += `\n${line}`
      queries.push(currentQuery.trim())
      currentQuery = ''
      inQuery = false
    } else if (inQuery) {
      currentQuery += `\n${line}`
    }
  }

  if (currentQuery.trim()) {
    queries.push(currentQuery.trim())
  }

  return queries.filter((query) => query.length > 0)
}

async function processValidationQuery(
  query: string,
  state: WorkflowState,
): Promise<{
  query: string
  success: boolean
  resultSet?: string
  errorMessage?: string
}> {
  try {
    const queryResult =
      await state.repositories.validation.createValidationQuery({
        designSessionId: state.designSessionId,
        queryString: query,
      })

    if (!queryResult.success || !queryResult.id) {
      console.error('Failed to save validation query:', queryResult.error)
      return { query, success: false, errorMessage: 'Failed to save query' }
    }

    const sessionId = `validation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const results = await executeQuery(sessionId, query)

    const success =
      Array.isArray(results) &&
      results.every(
        (result: unknown) =>
          Boolean((result as { success?: boolean }).success) === true,
      )

    const resultSet = JSON.stringify(results)
    const errorMessage = success ? null : getErrorMessage(results)

    await state.repositories.validation.createValidationResult({
      validationQueryId: queryResult.id,
      resultSet: success ? resultSet : null,
      status: success ? 'success' : 'failure',
      errorMessage,
    })

    if (success) {
      return { query, success, resultSet }
    }
    return { query, success, ...(errorMessage && { errorMessage }) }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    return { query, success: false, errorMessage }
  }
}

function getErrorMessage(results: unknown): string {
  if (Array.isArray(results)) {
    const failedResult = results.find(
      (r: unknown) => !(r as { success?: boolean }).success,
    ) as { error?: string }
    return failedResult?.error || 'Unknown error'
  }
  return 'Query execution failed'
}

/**
 * Validate Schema Node - Use Case Verification & DML Execution
 * Performed by qaAgent
 */
export async function validateSchemaNode(
  state: WorkflowState,
): Promise<WorkflowState> {
  try {
    if (!state.brd || state.brd.length === 0) {
      return { ...state, error: 'No BRD available for schema validation' }
    }

    const qaAgent = new QAAgent()
    const schemaText = convertSchemaToText(state.schemaData)
    const chatHistory = state.history.join('\n')
    const brdRequirements = state.brd.join('\n')

    const response = await qaAgent.generate({
      schema_text: schemaText,
      chat_history: chatHistory,
      user_message: state.userInput,
      brd_requirements: brdRequirements,
    })

    const dmlQueries = extractDMLQueries(response)

    if (dmlQueries.length === 0) {
      return { ...state, error: 'No DML queries generated for validation' }
    }

    const validationResults = await Promise.all(
      dmlQueries.map((query) => processValidationQuery(query, state)),
    )

    const hasFailures = validationResults.some((result) => !result.success)

    return {
      ...state,
      validationQueries: dmlQueries,
      validationResults,
      error: hasFailures
        ? 'Schema validation failed - some queries could not execute successfully'
        : undefined,
    }
  } catch (error) {
    console.error('Error in validateSchemaNode:', error)
    return {
      ...state,
      error: `Failed to validate schema: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}
