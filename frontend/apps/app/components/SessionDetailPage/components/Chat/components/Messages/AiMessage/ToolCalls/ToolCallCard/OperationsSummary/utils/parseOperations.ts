/* eslint-disable @typescript-eslint/consistent-type-assertions */
export type Operation = {
  op?: string
  type?: string
  path?: string
  value?: unknown
}

type ColumnInfo = {
  type?: string
  [key: string]: unknown
}

type IndexInfo = {
  columns?: string[]
  [key: string]: unknown
}

type ConstraintInfo = {
  type?: string
  [key: string]: unknown
}

const isColumnInfo = (value: unknown): value is ColumnInfo => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  // type field is optional, but if present, must be a string
  if ('type' in value) {
    const obj = value as Record<string, unknown>
    const typeValue = obj.type
    if (typeValue !== undefined && typeof typeValue !== 'string') {
      return false
    }
  }

  // ColumnInfo should be an object with optional type field
  // and may have other properties
  return true
}

const isIndexInfo = (value: unknown): value is IndexInfo => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  // columns field is optional, but if present, must be an array of strings
  if ('columns' in value) {
    const obj = value as Record<string, unknown>
    const columnsValue = obj.columns
    if (columnsValue !== undefined) {
      if (!Array.isArray(columnsValue)) {
        return false
      }
      // Check that all elements in columns array are strings
      if (!columnsValue.every((col) => typeof col === 'string')) {
        return false
      }
    }
  }

  return true
}

const isConstraintInfo = (value: unknown): value is ConstraintInfo => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  // type field is optional, but if present, must be a string
  if ('type' in value) {
    const obj = value as Record<string, unknown>
    const typeValue = obj.type
    if (typeValue !== undefined && typeof typeValue !== 'string') {
      return false
    }
  }

  return true
}

// Helper function to check if path is a table creation
const isTableCreation = (path: string): boolean => {
  return !!(
    path.match(/\/tables\/[^/]+$/) &&
    !path.includes('/columns/') &&
    !path.includes('/constraints/') &&
    !path.includes('/indexes/')
  )
}

// Helper to format table message
const formatTableMessage = (path: string): string => {
  const tableName = extractTableName(path)
  return `Creating table '${tableName}'`
}

// Helper to format column message
const formatColumnMessage = (path: string, value: unknown): string => {
  const columnName = extractColumnName(path)
  const columnInfo = isColumnInfo(value) ? value : {}
  const type = columnInfo.type || 'unknown'
  return `  Adding column '${columnName}' (${type})`
}

// Helper to format index message
const formatIndexMessage = (path: string, value: unknown): string => {
  const indexName = extractIndexName(path)
  const indexInfo = isIndexInfo(value) ? value : {}
  const columns = Array.isArray(indexInfo.columns)
    ? indexInfo.columns.join(', ')
    : ''
  return `  Adding index '${indexName}'${columns ? ` on (${columns})` : ''}`
}

// Helper to format constraint message
const formatConstraintMessage = (path: string, value: unknown): string => {
  const constraintName = extractConstraintName(path)
  const constraintInfo = isConstraintInfo(value) ? value : {}
  const type = constraintInfo.type || 'constraint'
  return `  Adding ${type} '${constraintName}'`
}

const getAddOperationMessage = (
  path: string | undefined,
  value: unknown,
): string => {
  if (!path) return 'Adding new element...'

  if (isTableCreation(path)) {
    return formatTableMessage(path)
  }
  if (path.includes('/columns/')) {
    return formatColumnMessage(path, value)
  }
  if (path.includes('/indexes/')) {
    return formatIndexMessage(path, value)
  }
  if (path.includes('/constraints/')) {
    return formatConstraintMessage(path, value)
  }

  return 'Adding new element...'
}

const getRemoveOperationMessage = (path: string | undefined): string => {
  if (!path) return 'Removing element...'
  if (path.includes('/tables/')) {
    const tableName = extractTableName(path)
    return `Removing table "${tableName}"...`
  }
  if (path.includes('/columns/')) {
    const columnName = extractColumnName(path)
    return `Removing column "${columnName}"...`
  }
  return 'Removing element...'
}

const getReplaceOperationMessage = (path: string | undefined): string => {
  if (!path) return 'Updating element...'
  if (path.includes('/columns/')) {
    const columnName = extractColumnName(path)
    return `Updating column "${columnName}"...`
  }
  if (path.includes('/tables/')) {
    const tableName = extractTableName(path)
    return `Updating table "${tableName}"...`
  }
  return 'Updating element...'
}

export const parseOperations = (operations: Operation[]): string[] => {
  const summaryLines: string[] = []

  operations.forEach((op) => {
    const operationType = op.op || op.type
    const path = op.path
    const value = op.value

    switch (operationType) {
      case 'add':
        summaryLines.push(getAddOperationMessage(path, value))
        break
      case 'remove':
        summaryLines.push(getRemoveOperationMessage(path))
        break
      case 'replace':
        summaryLines.push(getReplaceOperationMessage(path))
        break
      case 'move':
        summaryLines.push('Moving element...')
        break
      default:
        if (operationType) {
          summaryLines.push(`Executing ${operationType} operation...`)
        }
    }
  })

  if (summaryLines.length === 0) {
    summaryLines.push('Processing...')
  }

  return summaryLines
}

const extractTableName = (path: string): string => {
  const match = path.match(/\/tables\/([^/]+)/)
  return match?.[1] ?? 'table'
}

const extractColumnName = (path: string): string => {
  const match = path.match(/\/columns\/([^/]+)/)
  return match?.[1] ?? 'column'
}

const extractIndexName = (path: string): string => {
  const match = path.match(/\/indexes\/([^/]+)/)
  return match?.[1] ?? 'index'
}

const extractConstraintName = (path: string): string => {
  const match = path.match(/\/constraints\/([^/]+)/)
  return match?.[1] ?? 'constraint'
}
