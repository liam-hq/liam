import { isPrimaryKey, type Schema } from '@liam-hq/schema'

const tableToDocument = (
  tableName: string,
  tableData: Schema['tables'][string],
): string => {
  const tableDescription = `Table: ${tableName}\nDescription: ${tableData.comment || 'No description'}\n`

  let columnsText = 'Columns:\n'
  if (tableData.columns) {
    for (const [columnName, columnData] of Object.entries(tableData.columns)) {
      columnsText += `- ${columnName}: ${columnData.type || 'unknown type'} ${!columnData.notNull ? '(nullable)' : '(not nullable)'}\n`
      if (columnData.comment) {
        columnsText += `  Description: ${columnData.comment}\n`
      }
    }
  }

  let primaryKeyText = ''
  const primaryKeyColumns = Object.entries(tableData.columns || {})
    .filter(([name]) => isPrimaryKey(name, tableData.constraints || {}))
    .map(([name]) => name)

  if (primaryKeyColumns.length > 0) {
    primaryKeyText = `Primary Key: ${primaryKeyColumns.join(', ')}\n`
  }

  return `${tableDescription}${columnsText}${primaryKeyText}`
}

export const convertSchemaToText = (schema: Schema): string => {
  let schemaText = 'FULL DATABASE SCHEMA:\n\n'

  if (schema.tables) {
    schemaText += 'TABLES:\n\n'
    for (const [tableName, tableData] of Object.entries(schema.tables)) {
      const tableDoc = tableToDocument(tableName, tableData)
      schemaText = `${schemaText}${tableDoc}\n\n`
    }
  }

  return schemaText
}
