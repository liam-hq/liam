import type { Database } from '@liam-hq/db'
import { postgresqlSchemaDeparser } from '@liam-hq/db-structure'
import { executeQuery } from '@liam-hq/pglite-server'
import type { SqlResult } from '@liam-hq/pglite-server/src/types'
import type { SchemaData } from '@liam-hq/db-structure/src/types'

export interface DdlExecutionResult {
  success: boolean
  ddlStatements: string
  results?: SqlResult[]
  errorMessages?: string
}

export interface DdlExecutionOptions {
  designSessionId: string
  repositories: {
    schema: {
      createValidationQuery: (params: {
        designSessionId: string
        queryString: string
      }) => Promise<{ success: boolean; queryId?: string; error?: string }>
      createValidationResults: (params: {
        validationQueryId: string
        results: SqlResult[]
      }) => Promise<void>
    }
  }
  logMessage?: (message: string, role: Database['public']['Enums']['assistant_role_enum']) => Promise<void>
}

/**
 * Execute DDL statements for given schema data
 * This function generates DDL from schema data and executes it, with proper error handling
 */
export async function executeDdl(
  schemaData: SchemaData,
  options: DdlExecutionOptions,
): Promise<DdlExecutionResult> {
  const { designSessionId, repositories, logMessage } = options

  // Generate DDL from schema data
  const result = postgresqlSchemaDeparser(schemaData)

  if (result.errors.length > 0) {
    if (logMessage) {
      await logMessage('Error occurred during DDL generation', 'db')
    }
    return {
      success: false,
      ddlStatements: 'DDL generation failed due to an unexpected error.',
      errorMessages: 'DDL generation failed due to an unexpected error.',
    }
  }

  const ddlStatements = result.value

  const tableCount = Object.keys(schemaData.tables).length

  if (logMessage) {
    await logMessage(`Generated DDL statements (${tableCount} tables)`, 'db')
  }

  if (!ddlStatements || !ddlStatements.trim()) {
    if (logMessage) {
      await logMessage('No DDL statements to execute', 'db')
    }
    return {
      success: true,
      ddlStatements,
    }
  }

  if (logMessage) {
    await logMessage('Executing DDL statements...', 'db')
  }

  const results: SqlResult[] = await executeQuery(designSessionId, ddlStatements)

  // Save query and results to database
  const queryResult = await repositories.schema.createValidationQuery({
    designSessionId,
    queryString: ddlStatements,
  })

  if (queryResult.success) {
    await repositories.schema.createValidationResults({
      validationQueryId: queryResult.queryId!,
      results,
    })

    const successCount = results.filter((r) => r.success).length
    const errorCount = results.length - successCount
    if (logMessage) {
      await logMessage(
        `DDL Execution Complete: ${successCount} successful, ${errorCount} failed queries`,
        'db',
      )
    }
  }

  const hasErrors = results.some((result: SqlResult) => !result.success)

  if (hasErrors) {
    const errorMessages = results
      .filter((result: SqlResult) => !result.success)
      .map(
        (result: SqlResult) =>
          `SQL: ${result.sql}, Error: ${JSON.stringify(result.result)}`,
      )
      .join('; ')

    if (logMessage) {
      await logMessage('Error occurred during DDL execution', 'db')
    }

    return {
      success: false,
      ddlStatements,
      results,
      errorMessages,
    }
  }

  if (logMessage) {
    await logMessage('DDL execution completed successfully', 'db')
  }

  return {
    success: true,
    ddlStatements,
    results,
  }
}