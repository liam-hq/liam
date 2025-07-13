import type {
  Columns,
  Constraints,
  ForeignKeyConstraintReferenceOption,
  Indexes,
  InterleaveConstraintReferenceOption,
  Tables,
} from '../../schema/index.js'
import { aColumn, anIndex, aTable } from '../../schema/index.js'
import type { Processor, ProcessResult } from '../types.js'
import schema from './schema.generated.js'

const FK_ACTIONS = 'SET NULL|SET DEFAULT|RESTRICT|CASCADE|NO ACTION'

const INTERLEAVE_IN_PARENT_ACTIONS = 'CASCADE|NO ACTION'

function extractForeignKeyActions(def: string): {
  updateConstraint: ForeignKeyConstraintReferenceOption
  deleteConstraint: ForeignKeyConstraintReferenceOption
} {
  const defaultAction: ForeignKeyConstraintReferenceOption = 'NO_ACTION'
  const actions: {
    updateConstraint: ForeignKeyConstraintReferenceOption
    deleteConstraint: ForeignKeyConstraintReferenceOption
  } = {
    updateConstraint: defaultAction,
    deleteConstraint: defaultAction,
  }

  const updateMatch = def.match(new RegExp(`ON UPDATE (${FK_ACTIONS})`))
  if (updateMatch?.[1]) {
    actions.updateConstraint = normalizeConstraintName(
      updateMatch[1].toLowerCase(),
    )
  }

  const deleteMatch = def.match(new RegExp(`ON DELETE (${FK_ACTIONS})`))
  if (deleteMatch?.[1]) {
    actions.deleteConstraint = normalizeConstraintName(
      deleteMatch[1].toLowerCase(),
    )
  }

  return actions
}

function extractInterleaveActions(def: string): {
  deleteConstraint: InterleaveConstraintReferenceOption
} {
  const deleteMatch = def.match(
    new RegExp(`ON DELETE (${INTERLEAVE_IN_PARENT_ACTIONS})`),
  )
  if (deleteMatch?.[1] && deleteMatch[1].toLowerCase() === 'cascade') {
    return { deleteConstraint: 'CASCADE' }
  }

  return { deleteConstraint: 'NO_ACTION' }
}

function normalizeConstraintName(
  constraint: string,
): ForeignKeyConstraintReferenceOption {
  switch (constraint) {
    case 'cascade':
      return 'CASCADE'
    case 'restrict':
      return 'RESTRICT'
    case 'set null':
      return 'SET_NULL'
    case 'set default':
      return 'SET_DEFAULT'
    default:
      return 'NO_ACTION'
  }
}

/**
 * Process columns for a table
 */
function processColumns(
  tblsColumns: Array<{
    name: string
    type: string
    nullable: boolean
    default?: string | null
    comment?: string | null
  }>,
): Columns {
  const columns: Columns = {}

  for (const tblsColumn of tblsColumns) {
    const defaultValue = extractDefaultValue(tblsColumn.default)

    columns[tblsColumn.name] = aColumn({
      name: tblsColumn.name,
      type: tblsColumn.type,
      notNull: !tblsColumn.nullable,
      default: defaultValue,
      comment: tblsColumn.comment ?? null,
    })
  }

  return columns
}

/**
 * Process a PRIMARY KEY constraint
 */
function processPrimaryKeyConstraint(constraint: {
  type: string
  name: string
  columns?: string[]
  def: string
  referenced_table?: string
  referenced_columns?: string[]
}): [string, Constraints[string]] | null {
  if (
    constraint.type === 'PRIMARY KEY' &&
    constraint.columns?.length === 1 &&
    constraint.columns?.[0]
  ) {
    return [
      constraint.name,
      {
        type: 'PRIMARY KEY',
        name: constraint.name,
        columnName: constraint.columns[0],
      },
    ]
  }

  return null
}

/**
 * Process a FOREIGN KEY constraint
 */
function processForeignKeyConstraint(constraint: {
  type: string
  name: string
  columns?: string[]
  def: string
  referenced_table?: string
  referenced_columns?: string[]
}): [string, Constraints[string]] | null {
  if (
    constraint.type === 'FOREIGN KEY' &&
    constraint.columns?.length === 1 &&
    constraint.columns[0] &&
    constraint.referenced_columns?.length === 1 &&
    constraint.referenced_columns[0] &&
    constraint.referenced_table
  ) {
    const { updateConstraint, deleteConstraint } = extractForeignKeyActions(
      constraint.def,
    )

    return [
      constraint.name,
      {
        type: 'FOREIGN KEY',
        name: constraint.name,
        columnName: constraint.columns[0],
        targetTableName: constraint.referenced_table,
        targetColumnName: constraint.referenced_columns[0],
        updateConstraint,
        deleteConstraint,
      },
    ]
  }

  return null
}

/**
 * Process a UNIQUE constraint
 */
function processUniqueConstraint(constraint: {
  type: string
  name: string
  columns?: string[]
  def: string
  referenced_table?: string
  referenced_columns?: string[]
}): [string, Constraints[string]] | null {
  if (
    constraint.type === 'UNIQUE' &&
    constraint.columns?.length === 1 &&
    constraint.columns[0]
  ) {
    return [
      constraint.name,
      {
        type: 'UNIQUE',
        name: constraint.name,
        columnName: constraint.columns[0],
      },
    ]
  }

  return null
}

/**
 * Process a CHECK constraint
 */
function processCheckConstraint(constraint: {
  type: string
  name: string
  columns?: string[]
  def: string
  referenced_table?: string
  referenced_columns?: string[]
}): [string, Constraints[string]] | null {
  if (constraint.type === 'CHECK') {
    return [
      constraint.name,
      {
        type: 'CHECK',
        name: constraint.name,
        detail: constraint.def,
      },
    ]
  }

  return null
}

function processInterleaveConstraint(constraint: {
  type: string
  name: string
  columns?: string[]
  def: string
  referenced_table?: string
  referenced_columns?: string[]
}): [string, Constraints[string]] | null {
  if (
    constraint.type === 'INTERLEAVE' &&
    constraint.columns?.length === 1 &&
    constraint.columns[0] &&
    constraint.referenced_table &&
    constraint.referenced_columns?.length === 1 &&
    constraint.referenced_columns[0]
  ) {
    const { deleteConstraint } = extractInterleaveActions(constraint.def)
    return [
      constraint.name,
      {
        type: 'INTERLEAVE',
        name: constraint.name,
        columnName: constraint.columns[0],
        targetTableName: constraint.referenced_table,
        targetColumnName: constraint.referenced_columns[0],
        updateConstraint: 'NO_ACTION',
        deleteConstraint,
      },
    ]
  }
  return null
}

/**
 * Process constraints for a table
 */
function processConstraints(
  tblsConstraints:
    | Array<{
        type: string
        name: string
        columns?: string[]
        def: string
        referenced_table?: string
        referenced_columns?: string[]
      }>
    | undefined,
): Constraints {
  const constraints: Constraints = {}

  if (!tblsConstraints) {
    return constraints
  }

  for (const constraint of tblsConstraints) {
    let result: [string, Constraints[string]] | null = null

    // Process different constraint types
    if (constraint.type === 'PRIMARY KEY') {
      result = processPrimaryKeyConstraint(constraint)
    } else if (constraint.type === 'FOREIGN KEY') {
      result = processForeignKeyConstraint(constraint)
    } else if (constraint.type === 'UNIQUE') {
      result = processUniqueConstraint(constraint)
    } else if (constraint.type === 'CHECK') {
      result = processCheckConstraint(constraint)
    } else if (constraint.type === 'INTERLEAVE') {
      result = processInterleaveConstraint(constraint)
    }

    // Add constraint to the collection if valid
    if (result) {
      constraints[result[0]] = result[1]
    }
  }

  return constraints
}

/**
 * Process indexes for a table
 */
function processIndexes(
  tblsIndexes:
    | Array<{
        name: string
        def: string
        columns: string[]
      }>
    | undefined,
): Indexes {
  const indexes: Indexes = {}

  if (!tblsIndexes) {
    return indexes
  }

  for (const tblsIndex of tblsIndexes) {
    indexes[tblsIndex.name] = anIndex({
      name: tblsIndex.name,
      columns: tblsIndex.columns,
      unique: tblsIndex.def.toLowerCase().includes('unique'),
      type: tblsIndex.def.toLocaleLowerCase().match(/using\s+(\w+)/)?.[1] || '',
    })
  }

  return indexes
}

/**
 * Process a single table
 */
function processTable(tblsTable: {
  name: string
  columns: Array<{
    name: string
    type: string
    nullable: boolean
    default?: string | null
    comment?: string | null
  }>
  constraints?: Array<{
    type: string
    name: string
    columns?: string[]
    def: string
    referenced_table?: string
    referenced_columns?: string[]
  }>
  indexes?: Array<{
    name: string
    def: string
    columns: string[]
  }>
  comment?: string | null
}): [string, Tables[string]] {
  // Process table components
  const columns = processColumns(tblsTable.columns)
  const constraints = processConstraints(tblsTable.constraints)
  const indexes = processIndexes(tblsTable.indexes)

  // Create the table
  return [
    tblsTable.name,
    aTable({
      name: tblsTable.name,
      columns,
      indexes,
      constraints,
      comment: tblsTable.comment ?? null,
    }),
  ]
}

/**
 * Main function to parse a tbls schema
 */
async function parseTblsSchema(schemaString: string): Promise<ProcessResult> {
  // Parse the schema
  const parsedSchema = JSON.parse(schemaString)
  const result = schema.safeParse(parsedSchema)

  // Handle invalid schema
  if (!result.success) {
    return {
      value: {
        tables: {},
      },
      errors: [new Error(`Invalid schema format: ${result.error}`)],
    }
  }

  // Initialize collections
  const tables: Tables = {}
  const errors: Error[] = []

  // Define compatible types for type assertions
  type CompatibleTable = {
    name: string
    columns: Array<{
      name: string
      type: string
      nullable: boolean
      default?: string | null
      comment?: string | null
    }>
    constraints?: Array<{
      type: string
      name: string
      columns?: string[]
      def: string
      referenced_table?: string
      referenced_columns?: string[]
    }>
    indexes?: Array<{
      name: string
      def: string
      columns: string[]
    }>
    comment?: string | null
  }

  // Process tables
  for (const tblsTable of result.data.tables) {
    // Use type assertion with a specific type
    const [tableName, table] = processTable(tblsTable as CompatibleTable)
    tables[tableName] = table
  }

  // Return the schema
  return {
    value: {
      tables,
    },
    errors,
  }
}

function extractDefaultValue(
  value: string | null | undefined,
): Columns[string]['default'] {
  if (value === null || value === undefined) {
    return null
  }

  // Convert string to number if it represents a number
  if (!Number.isNaN(Number(value))) {
    return Number(value)
  }

  // Convert string to boolean if it represents a boolean
  if (value.toLowerCase() === 'true') {
    return true
  }
  if (value.toLowerCase() === 'false') {
    return false
  }

  return value
}

export const processor: Processor = (str) => parseTblsSchema(str)
