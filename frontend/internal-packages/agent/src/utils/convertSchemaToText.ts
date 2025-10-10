import {
  type Columns,
  type Constraints,
  type Indexes,
  isPrimaryKey,
  type Schema,
  type Table,
} from '@liam-hq/schema'

const formatColumns = (columns: Columns): string => {
  let text = 'Columns:\n'
  for (const [columnName, columnData] of Object.entries(columns)) {
    text += `- ${columnName}: ${columnData.type || 'unknown type'} ${!columnData.notNull ? '(nullable)' : '(not nullable)'}\n`
    if (columnData.comment) {
      text += `  Description: ${columnData.comment}\n`
    }
    if (columnData.check) {
      text += `  Check: ${columnData.check}\n`
    }
  }
  return text
}

const formatPrimaryKey = (
  columns: Columns,
  constraints: Constraints,
): string => {
  const primaryKeyColumns = Object.entries(columns)
    .filter(([name]) => isPrimaryKey(name, constraints))
    .map(([name]) => name)

  if (primaryKeyColumns.length === 0) return ''
  return `Primary Key: ${primaryKeyColumns.join(', ')}\n`
}

const formatConstraints = (constraints: Constraints): string => {
  if (Object.keys(constraints).length === 0) return ''

  let text = 'Constraints:\n'
  for (const [constraintName, constraint] of Object.entries(constraints)) {
    if (constraint.type === 'PRIMARY KEY') {
      continue // Already shown in Primary Key section
    }

    text += `- ${constraintName} (${constraint.type})`
    if (constraint.type === 'FOREIGN KEY') {
      text += `: ${constraint.columnNames.join(', ')} -> ${constraint.targetTableName}(${constraint.targetColumnNames.join(', ')})`
    } else if (constraint.type === 'UNIQUE') {
      text += `: ${constraint.columnNames.join(', ')}`
    } else if (constraint.type === 'CHECK') {
      text += `: ${constraint.detail}`
    }
    text += '\n'
  }
  // If only PRIMARY KEY constraints exist, return empty string
  if (text === 'Constraints:\n') return ''
  return text
}

const formatIndexes = (indexes: Indexes): string => {
  if (Object.keys(indexes).length === 0) return ''

  let text = 'Indexes:\n'
  for (const [indexName, index] of Object.entries(indexes)) {
    text += `- ${indexName} (${index.unique ? 'UNIQUE' : 'NON-UNIQUE'}): ${index.columns.join(', ')}\n`
  }
  return text
}

const tableToDocument = (tableName: string, tableData: Table): string => {
  const tableDescription = `Table: ${tableName}\nDescription: ${tableData.comment || 'No description'}\n`
  const columnsText = formatColumns(tableData.columns)
  const primaryKeyText = formatPrimaryKey(
    tableData.columns,
    tableData.constraints,
  )
  const constraintsText = formatConstraints(tableData.constraints)
  const indexesText = formatIndexes(tableData.indexes)

  return `${tableDescription}${columnsText}${primaryKeyText}${constraintsText}${indexesText}`
}

export const convertSchemaToText = (schema: Schema): string => {
  let schemaText = 'FULL DATABASE SCHEMA:\n\n'

  schemaText += 'TABLES:\n\n'
  for (const [tableName, tableData] of Object.entries(schema.tables)) {
    const tableDoc = tableToDocument(tableName, tableData)
    schemaText = `${schemaText}${tableDoc}\n\n`
  }

  return schemaText
}
