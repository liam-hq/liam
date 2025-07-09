import type { Column } from '@liam-hq/db-structure'
import type { Usecase } from '../../../langchain/agents/qaGenerateUsecaseAgent/agent'
import { getWorkflowNodeProgress } from '../shared/getWorkflowNodeProgress'
import type { WorkflowState } from '../types'

const NODE_NAME = 'prepareDmlNode'

/**
 * Generate sample value based on column name
 */
const generateValueByName = (columnName: string): string | null => {
  const lowerName = columnName.toLowerCase()

  if (lowerName.includes('email')) {
    return `'user${Math.floor(Math.random() * 1000)}@example.com'`
  }
  if (lowerName.includes('name') || lowerName.includes('title')) {
    const sampleNames = ['John Doe', 'Jane Smith', 'Test User', 'Sample Name']
    return `'${sampleNames[Math.floor(Math.random() * sampleNames.length)]}'`
  }
  if (lowerName.includes('content') || lowerName.includes('description')) {
    return `'Sample content for testing'`
  }

  return null
}

/**
 * Generate sample value based on column type
 */
const generateValueByType = (
  columnType: string,
  columnName: string,
): string => {
  const lowerType = columnType.toLowerCase()

  if (lowerType.includes('int') || lowerType.includes('serial')) {
    return Math.floor(Math.random() * 100 + 1).toString()
  }
  if (lowerType.includes('bool')) {
    return Math.random() > 0.5 ? 'true' : 'false'
  }
  if (lowerType.includes('date') && !lowerType.includes('update')) {
    return `'${new Date().toISOString().split('T')[0]}'`
  }
  if (lowerType.includes('timestamp')) {
    return 'CURRENT_TIMESTAMP'
  }
  if (lowerType.includes('json')) {
    return `'{"key": "value"}'`
  }
  if (
    lowerType.includes('decimal') ||
    lowerType.includes('numeric') ||
    lowerType.includes('float')
  ) {
    return (Math.random() * 100).toFixed(2)
  }
  if (
    lowerType.includes('text') ||
    lowerType.includes('varchar') ||
    lowerType.includes('char')
  ) {
    return `'Sample ${columnName}'`
  }

  return `'default_value'`
}

/**
 * Generate appropriate sample values based on column type
 */
const generateSampleValue = (
  columnType: string,
  columnName: string,
): string => {
  // Try to generate by name first
  const valueByName = generateValueByName(columnName)
  if (valueByName !== null) {
    return valueByName
  }

  // Otherwise generate by type
  return generateValueByType(columnType, columnName)
}

/**
 * Determine operation type from use case
 */
const getOperationType = (usecase: Usecase) => {
  const lowerTitle = usecase.title.toLowerCase()
  const lowerDesc = usecase.description.toLowerCase()
  const lowerReq = usecase.requirement.toLowerCase()

  return {
    isUpdate:
      lowerTitle.includes('update') ||
      lowerDesc.includes('update') ||
      lowerReq.includes('update'),
    isDelete:
      lowerTitle.includes('delete') ||
      lowerDesc.includes('delete') ||
      lowerReq.includes('delete'),
    isBulk:
      usecase.requirementType === 'non_functional' &&
      (lowerReq.includes('performance') ||
        lowerReq.includes('concurrent') ||
        lowerReq.includes('load')),
  }
}

/**
 * Check if table name matches use case text
 */
const tableMatchesText = (tableName: string, text: string): boolean => {
  const lowerTableName = tableName.toLowerCase()
  const singularName = lowerTableName.endsWith('s')
    ? lowerTableName.slice(0, -1)
    : lowerTableName
  const lowerText = text.toLowerCase()

  return (
    lowerText.includes(lowerTableName) ||
    lowerText.includes(singularName) ||
    lowerText.includes(` ${singularName} `) ||
    lowerText.includes(` ${lowerTableName} `)
  )
}

/**
 * Find table by matching name in use case
 */
const findTableByName = (
  tables: WorkflowState['schemaData']['tables'][string][],
  usecase: Usecase,
): WorkflowState['schemaData']['tables'][string] | undefined => {
  // Check title first
  for (const table of tables) {
    if (tableMatchesText(table.name, usecase.title)) {
      return table
    }
  }

  // Then check description and requirement
  for (const table of tables) {
    if (
      tableMatchesText(table.name, usecase.description) ||
      tableMatchesText(table.name, usecase.requirement)
    ) {
      return table
    }
  }

  return undefined
}

/**
 * Find table by category
 */
const findTableByCategory = (
  tables: WorkflowState['schemaData']['tables'][string][],
  schemaData: WorkflowState['schemaData'],
  category: string,
): WorkflowState['schemaData']['tables'][string] | undefined => {
  const lowerCategory = category.toLowerCase()

  if (lowerCategory.includes('user') && schemaData.tables['users']) {
    return schemaData.tables['users']
  }

  if (lowerCategory.includes('content') || lowerCategory.includes('post')) {
    for (const table of tables) {
      const lowerName = table.name.toLowerCase()
      if (
        lowerName.includes('post') ||
        lowerName.includes('content') ||
        lowerName.includes('article')
      ) {
        return table
      }
    }
  }

  return undefined
}

/**
 * Find the most relevant table for a use case
 */
const findTargetTable = (
  usecase: Usecase,
  tables: WorkflowState['schemaData']['tables'][string][],
  schemaData: WorkflowState['schemaData'],
): WorkflowState['schemaData']['tables'][string] | undefined => {
  if (tables.length === 0) return undefined

  // Try to find by name matching
  const tableByName = findTableByName(tables, usecase)
  if (tableByName) return tableByName

  // Try to find by category
  if (usecase.requirementCategory) {
    const tableByCategory = findTableByCategory(
      tables,
      schemaData,
      usecase.requirementCategory,
    )
    if (tableByCategory) return tableByCategory
  }

  return tables[0] // Default to first table
}

/**
 * Check if a column is a primary key
 */
const isPrimaryKeyColumn = (
  col: Column,
  table: WorkflowState['schemaData']['tables'][string],
): boolean => {
  return Object.values(table.constraints).some(
    (constraint) =>
      constraint.type === 'PRIMARY KEY' &&
      'columnNames' in constraint &&
      constraint.columnNames.includes(col.name),
  )
}

/**
 * Generate DELETE statement
 */
const generateDeleteStatement = (tableName: string): string => {
  return `DELETE FROM ${tableName} WHERE id = 1;`
}

/**
 * Generate UPDATE statement
 */
const generateUpdateStatement = (
  table: WorkflowState['schemaData']['tables'][string],
): string => {
  const updateColumns = Object.values(table.columns)
    .filter(
      (col) =>
        !isPrimaryKeyColumn(col, table) && !col.name.includes('created_at'),
    )
    .slice(0, 2)

  if (updateColumns.length === 0) return ''

  const setClauses = updateColumns
    .map((col) => `${col.name} = ${generateSampleValue(col.type, col.name)}`)
    .join(', ')

  return `UPDATE ${table.name} SET ${setClauses} WHERE id = 1;`
}

/**
 * Generate INSERT statement
 */
const generateInsertStatement = (
  table: WorkflowState['schemaData']['tables'][string],
): string => {
  const insertColumns = Object.values(table.columns).filter(
    (col) => !isPrimaryKeyColumn(col, table) && !col.default,
  )

  if (insertColumns.length === 0) return ''

  const columnNames = insertColumns.map((col) => col.name).join(', ')
  const values = insertColumns
    .map((col) => {
      if (col.name.endsWith('_id') && col.name !== 'id') {
        return '1' // Reference to existing record
      }
      return generateSampleValue(col.type, col.name)
    })
    .join(', ')

  return `INSERT INTO ${table.name} (${columnNames}) VALUES (${values});`
}

/**
 * Generate statements for operation type
 */
const generateStatementsForOperation = (
  targetTable: WorkflowState['schemaData']['tables'][string],
  operationType: ReturnType<typeof getOperationType>,
): string[] => {
  const statements: string[] = []

  if (operationType.isDelete) {
    statements.push(generateDeleteStatement(targetTable.name))
  } else if (operationType.isUpdate) {
    const updateSql = generateUpdateStatement(targetTable)
    if (updateSql) statements.push(updateSql)
  } else {
    const insertSql = generateInsertStatement(targetTable)
    if (insertSql) {
      if (operationType.isBulk) {
        for (let i = 0; i < 10; i++) {
          statements.push(generateInsertStatement(targetTable))
        }
      } else {
        statements.push(insertSql)
      }
    }
  }

  return statements
}

/**
 * Generate DML statements based on use case type
 */
const generateDmlForUseCase = (
  usecase: Usecase,
  schemaData: WorkflowState['schemaData'],
): string => {
  const tables = Object.values(schemaData.tables)
  const targetTable = findTargetTable(usecase, tables, schemaData)

  if (!targetTable) {
    return '' // No appropriate table found
  }

  const statements: string[] = [`-- ${usecase.title}`]
  const operationType = getOperationType(usecase)
  const operationStatements = generateStatementsForOperation(
    targetTable,
    operationType,
  )

  statements.push(...operationStatements)
  return statements.join('\n')
}

/**
 * Prepare DML Node - Generates DML statements for testing
 * Based on use cases and schema
 */
export async function prepareDmlNode(
  state: WorkflowState,
): Promise<WorkflowState> {
  state.logger.log(`[${NODE_NAME}] Started`)

  // Update progress message if available
  if (state.progressTimelineItemId) {
    await state.repositories.schema.updateTimelineItem(
      state.progressTimelineItemId,
      {
        content: 'Processing: prepareDML',
        progress: getWorkflowNodeProgress('prepareDML'),
      },
    )
  }

  // Validate prerequisites
  if (!state.generatedUsecases || state.generatedUsecases.length === 0) {
    const errorMessage = 'No use cases found. Cannot generate DML statements.'
    const error = new Error(`[${NODE_NAME}] ${errorMessage}`)
    state.logger.error(error.message)
    return {
      ...state,
      error,
    }
  }

  if (
    !state.schemaData.tables ||
    Object.keys(state.schemaData.tables).length === 0
  ) {
    const errorMessage =
      'No tables found in schema. Cannot generate DML statements.'
    const error = new Error(`[${NODE_NAME}] ${errorMessage}`)
    state.logger.error(error.message)
    return {
      ...state,
      error,
    }
  }

  // Generate DML statements for each use case
  const dmlStatements: string[] = []

  for (const usecase of state.generatedUsecases) {
    const dml = generateDmlForUseCase(usecase, state.schemaData)
    if (dml) {
      dmlStatements.push(dml)
      dmlStatements.push('') // Empty line between use cases
    }
  }

  const finalDml = dmlStatements.join('\n').trim()

  state.logger.log(
    `[${NODE_NAME}] Generated DML for ${state.generatedUsecases.length} use cases`,
  )
  state.logger.log(`[${NODE_NAME}] Completed`)

  return {
    ...state,
    dmlStatements: finalDml,
    error: undefined,
  }
}
