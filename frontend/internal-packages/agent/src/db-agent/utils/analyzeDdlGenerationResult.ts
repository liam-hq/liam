import type { Schema } from '@liam-hq/db-structure'

type DdlAnalysisResult = {
  isEmpty: boolean
  tableCount: number
  hasErrors: boolean
  errorMessages: string[]
  warnings: string[]
  detailedReason?: string
}

/**
 * Analyzes the result of DDL generation to provide detailed diagnostics
 */
export const analyzeDdlGenerationResult = (
  schema: Schema,
  ddlResult: { value: string; errors: { message: string }[] },
): DdlAnalysisResult => {
  const analysis: DdlAnalysisResult = {
    isEmpty: false,
    tableCount: 0,
    hasErrors: false,
    errorMessages: [],
    warnings: [],
  }

  // Count tables
  analysis.tableCount = Object.keys(schema.tables || {}).length

  // Check for errors from deparser
  if (ddlResult.errors.length > 0) {
    analysis.hasErrors = true
    analysis.errorMessages = ddlResult.errors.map((e) => e.message)
    analysis.detailedReason = `DDL generation failed with ${ddlResult.errors.length} error(s): ${analysis.errorMessages.join('; ')}`
    return analysis
  }

  // Check if DDL is empty
  const trimmedDdl = ddlResult.value.trim()
  if (!trimmedDdl) {
    analysis.isEmpty = true

    if (analysis.tableCount === 0) {
      analysis.detailedReason =
        'Schema is empty - no tables defined. Create at least one table to generate DDL.'
    } else {
      // This is unusual - we have tables but no DDL
      analysis.warnings.push(
        `Schema contains ${analysis.tableCount} table(s) but no DDL was generated`,
      )
      analysis.detailedReason =
        'DDL generation produced empty result despite having tables. This may indicate a deparser issue.'

      // Check for specific issues
      const tableNames = Object.keys(schema.tables || {})
      if (tableNames.length > 0) {
        const tablesWithoutColumns = tableNames.filter((tableName) => {
          const table = schema.tables?.[tableName]
          return !table?.columns || Object.keys(table.columns).length === 0
        })

        if (tablesWithoutColumns.length > 0) {
          analysis.warnings.push(
            `Tables without columns: ${tablesWithoutColumns.join(', ')}`,
          )
          analysis.detailedReason = `DDL is empty because the following tables have no columns: ${tablesWithoutColumns.join(', ')}. Add columns to these tables.`
        }
      }
    }
  }

  // Additional schema quality checks
  if (analysis.tableCount > 0 && !analysis.isEmpty) {
    const tableNames = Object.keys(schema.tables || {})

    // Check for tables without primary keys
    const tablesWithoutPK = tableNames.filter((tableName) => {
      const table = schema.tables?.[tableName]
      if (!table) return true
      const constraints = Object.values(table.constraints || {})
      return !constraints.some((c) => c.type === 'PRIMARY KEY')
    })

    if (tablesWithoutPK.length > 0) {
      analysis.warnings.push(
        `Tables without primary keys: ${tablesWithoutPK.join(', ')}`,
      )
    }

    // Check for potential naming issues
    const invalidTableNames = tableNames.filter(
      (name) => /[^a-zA-Z0-9_]/.test(name) || /^\d/.test(name),
    )

    if (invalidTableNames.length > 0) {
      analysis.warnings.push(
        `Tables with potentially invalid names: ${invalidTableNames.join(', ')}`,
      )
    }
  }

  return analysis
}
