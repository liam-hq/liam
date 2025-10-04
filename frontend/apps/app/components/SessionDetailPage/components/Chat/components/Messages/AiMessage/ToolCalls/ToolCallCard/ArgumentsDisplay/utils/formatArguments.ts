type Operation = {
  op?: string
  type?: string
  path?: string
  value?: unknown
}

type ValueWithColumns = {
  columns?: string[]
  type?: string
  references?: {
    table: string
    columns: string[]
  }
  notNull?: boolean
  unique?: boolean
  default?: unknown
  [key: string]: unknown
}

const isValueWithColumns = (value: unknown): value is ValueWithColumns => {
  return typeof value === 'object' && value !== null
}

const hasOperations = (obj: unknown): obj is { operations: unknown } => {
  return typeof obj === 'object' && obj !== null && 'operations' in obj
}

type RequirementsArgs = {
  goal?: unknown
  testcases?: unknown
}

const isRequirementsArgs = (args: unknown): args is RequirementsArgs => {
  if (typeof args !== 'object' || args === null) {
    return false
  }
  // Check for at least one of the expected properties
  return 'goal' in args || 'testcases' in args
}

type TestCaseObject = {
  title: unknown
  type: unknown
}

const isTestCaseObject = (tc: unknown): tc is TestCaseObject => {
  return typeof tc === 'object' && tc !== null && 'title' in tc && 'type' in tc
}

const formatSaveRequirements = (args: unknown): string[] => {
  const lines: string[] = []

  if (!isRequirementsArgs(args)) {
    return ['No requirements found']
  }

  const argsObj = args

  if (argsObj.goal) {
    lines.push('🎯 Goal:')
    lines.push(`  ${argsObj.goal}`)
    lines.push(' ') // Minimal space for visual separation
  }

  if (argsObj.testcases && typeof argsObj.testcases === 'object') {
    lines.push('✅ Test Cases:')
    Object.entries(argsObj.testcases).forEach(([category, testcases]) => {
      if (!Array.isArray(testcases)) {
        return
      }
      lines.push(`  ${category}:`)
      testcases.forEach((tc: unknown, index: number) => {
        if (isTestCaseObject(tc)) {
          const title = String(tc.title)
          const type = String(tc.type)
          lines.push(`    ${index + 1}. ${title} (${type})`)
        } else {
          lines.push(`    ${index + 1}. ${String(tc)}`)
        }
      })
      lines.push(' ') // Minimal space for visual separation
    })
  }

  // Remove only the last separator line if it exists
  if (lines.length > 0 && lines[lines.length - 1] === ' ') {
    lines.pop()
  }

  return lines.length > 0 ? lines : ['No requirements found']
}

const formatEnum = (path: string): string => {
  const enumName = path.match(/\/enums\/([^/]+)/)?.[1] ?? 'enum'
  return `Creating enum '${enumName}'`
}

const formatExtension = (path: string): string => {
  const extensionName = path.match(/\/extensions\/([^/]+)/)?.[1] ?? 'extension'
  return `Enabling extension '${extensionName}'`
}

const formatTable = (path: string): string => {
  const tableName = path.match(/\/tables\/([^/]+)/)?.[1] ?? 'table'
  return `Creating table '${tableName}'`
}

const formatColumn = (path: string, value: unknown): string => {
  const columnName = path.match(/\/columns\/([^/]+)/)?.[1] ?? 'column'
  const valueTyped = isValueWithColumns(value) ? value : {}
  const type = valueTyped.type || 'unknown'
  const notNull = valueTyped.notNull ? ' NOT NULL' : ''
  const unique = valueTyped.unique ? ' UNIQUE' : ''
  const defaultVal =
    valueTyped.default !== undefined
      ? ` DEFAULT ${JSON.stringify(valueTyped.default)}`
      : ''
  return `  Adding column '${columnName}' (${type}${notNull}${unique}${defaultVal})`
}

const formatIndex = (path: string, value: unknown): string => {
  const indexName = path.match(/\/indexes\/([^/]+)/)?.[1] ?? 'index'
  const valueTyped = isValueWithColumns(value) ? value : {}
  const columns = valueTyped.columns ? valueTyped.columns.join(', ') : ''
  return `  Adding index '${indexName}'${columns ? ` on (${columns})` : ''}`
}

const formatConstraint = (path: string, value: unknown): string => {
  const constraintName =
    path.match(/\/constraints\/([^/]+)/)?.[1] ?? 'constraint'
  const valueTyped = isValueWithColumns(value) ? value : {}
  const type = valueTyped.type || 'constraint'

  // Format constraint type with proper casing
  const formattedType = type
    .replace('primary_key', 'PRIMARY KEY')
    .replace('foreign_key', 'FOREIGN KEY')
    .replace('unique', 'UNIQUE')

  const columns = valueTyped.columns
    ? ` on (${valueTyped.columns.join(', ')})`
    : ''
  const references = valueTyped.references
    ? ` -> ${valueTyped.references.table}(${valueTyped.references.columns.join(', ')})`
    : ''
  return `  Adding ${formattedType} '${constraintName}'${columns}${references}`
}

// Helper function to format add operations
const formatAddOperation = (
  path: string | undefined,
  value: unknown,
): string | null => {
  if (!path) return null

  if (path.match(/\/enums\/[^/]+$/)) {
    return formatEnum(path)
  }
  if (path.match(/\/extensions\/[^/]+$/)) {
    return formatExtension(path)
  }
  if (path.match(/\/tables\/[^/]+$/)) {
    return formatTable(path)
  }
  if (path.includes('/columns/')) {
    return formatColumn(path, value)
  }
  if (path.includes('/indexes/')) {
    return formatIndex(path, value)
  }
  if (path.includes('/constraints/')) {
    return formatConstraint(path, value)
  }

  return null
}

// Helper function to format remove operations
const formatRemoveOperation = (path: string | undefined): string => {
  if (!path) return 'Removing unknown'

  if (path.includes('/tables/')) {
    const tableName = path.match(/\/tables\/([^/]+)/)?.[1] ?? 'table'
    return `Removing table '${tableName}'`
  }
  if (path.includes('/columns/')) {
    const columnName = path.match(/\/columns\/([^/]+)/)?.[1] ?? 'column'
    return `  Removing column '${columnName}'`
  }

  return `Removing ${path}`
}

// Helper function to format replace operations
const formatReplaceOperation = (path: string | undefined): string => {
  if (!path) return 'Updating unknown'

  if (path.includes('/columns/')) {
    const columnName = path.match(/\/columns\/([^/]+)/)?.[1] ?? 'column'
    return `  Updating column '${columnName}'`
  }

  return `Updating ${path}`
}

// Main function to format a single operation
const formatSingleOperation = (op: Operation): string | null => {
  const operationType = op.op || op.type
  const path = op.path
  const value = op.value

  if (operationType === 'add') {
    return formatAddOperation(path, value)
  }
  if (operationType === 'remove') {
    return formatRemoveOperation(path)
  }
  if (operationType === 'replace') {
    return formatReplaceOperation(path)
  }
  if (operationType) {
    return `${operationType}: ${path || 'unknown path'}`
  }

  return null
}

const formatOperations = (operations: Operation[]): string[] => {
  const lines: string[] = []

  for (const op of operations) {
    const formatted = formatSingleOperation(op)
    if (formatted) {
      lines.push(formatted)
    }
  }

  return lines.length > 0 ? lines : ['Processing...']
}

// Helper to format array items
const formatArrayItem = (
  item: unknown,
  index: number,
  indent: string,
  depth: number,
): string[] => {
  if (typeof item === 'object' && item !== null) {
    return [`${indent}[${index}]:`, ...formatObject(item, depth + 1)]
  }
  return [`${indent}[${index}]: ${JSON.stringify(item)}`]
}

// Helper to format simple arrays inline
const formatSimpleArray = (arr: unknown[], indent: string): string | null => {
  if (
    arr.length <= 3 &&
    arr.every((item) => typeof item !== 'object' || item === null)
  ) {
    return `${indent}[${arr.map((item) => JSON.stringify(item)).join(', ')}]`
  }
  return null
}

// Helper to format array values
const formatArrayValue = (
  value: unknown[],
  key: string,
  indent: string,
  depth: number,
): string[] => {
  const lines: string[] = []

  if (value.length === 0) {
    lines.push(`${indent}${key}: []`)
  } else if (
    value.length <= 5 &&
    value.every((item) => typeof item !== 'object' || item === null)
  ) {
    lines.push(
      `${indent}${key}: [${value.map((item) => JSON.stringify(item)).join(', ')}]`,
    )
  } else if (value.length > 0 && typeof value[0] === 'object') {
    lines.push(`${indent}${key}: [${value.length} items]`)
    value.forEach((item, i) => {
      lines.push(`${indent}  [${i}]:`)
      lines.push(...formatObject(item, depth + 2))
    })
  } else {
    lines.push(`${indent}${key}: ${JSON.stringify(value)}`)
  }

  return lines
}

// Helper to format primitive values
const formatPrimitiveValue = (value: unknown): string => {
  if (typeof value === 'string' && value.length > 50) {
    return `"${value.substring(0, 47)}..."`
  }
  return JSON.stringify(value)
}

// Helper to format object property
const formatObjectProperty = (
  key: string,
  value: unknown,
  indent: string,
  depth: number,
): string[] => {
  const lines: string[] = []

  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      lines.push(...formatArrayValue(value, key, indent, depth))
    } else {
      lines.push(`${indent}${key}:`)
      lines.push(...formatObject(value, depth + 1))
    }
  } else {
    lines.push(`${indent}${key}: ${formatPrimitiveValue(value)}`)
  }

  return lines
}

const formatObject = (obj: unknown, depth = 0): string[] => {
  const lines: string[] = []
  const indent = '  '.repeat(depth)

  if (obj === null || obj === undefined) {
    return ['No arguments']
  }

  if (typeof obj !== 'object') {
    return [String(obj)]
  }

  if (Array.isArray(obj)) {
    const simpleFormat = formatSimpleArray(obj, indent)
    if (simpleFormat) {
      return [simpleFormat]
    }

    obj.forEach((item, index) => {
      lines.push(...formatArrayItem(item, index, indent, depth))
    })
    return lines
  }

  // Object formatting
  Object.entries(obj).forEach(([key, value]) => {
    lines.push(...formatObjectProperty(key, value, indent, depth))
  })

  return lines
}

export const formatArguments = (args: unknown): string[] => {
  // Special handling for operations (Database Schema Design)
  if (hasOperations(args)) {
    const operations = args.operations
    if (Array.isArray(operations) && operations.length > 0) {
      const formatted = formatOperations(operations)
      return formatted
    }
  }

  // Special handling for Save Requirements Tool
  if (
    typeof args === 'object' &&
    args !== null &&
    ('goal' in args || 'testcases' in args)
  ) {
    const formatted = formatSaveRequirements(args)
    return formatted
  }

  // General object formatting - show everything, user can collapse if needed
  return formatObject(args)
}
