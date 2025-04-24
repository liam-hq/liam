import type {
  Cardinality,
  Columns,
  Constraints,
  ForeignKeyConstraintReferenceOption,
  Indexes,
  Relationship,
  TableGroup,
  Tables,
} from '../../schema/index.js'
import { aColumn, aRelationship, aTable, anIndex } from '../../schema/index.js'
import type { ProcessResult, Processor } from '../types.js'
import { defaultRelationshipName } from '../utils/index.js'
import schema from './schema.generated.js'

function extractCardinality(cardinality: string): Cardinality {
  if (cardinality === 'zero_or_one') {
    return 'ONE_TO_ONE'
  }
  if (cardinality === 'zero_or_more') {
    return 'ONE_TO_MANY'
  }
  if (cardinality === 'one_or_more') {
    return 'ONE_TO_MANY'
  }
  return 'ONE_TO_MANY'
}

const FK_ACTIONS = 'SET NULL|SET DEFAULT|RESTRICT|CASCADE|NO ACTION'

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

// Extract unique column names from constraints
function extractUniqueColumnNames(constraints: any[] | undefined): Set<string> {
  return new Set(
    constraints
      ?.filter(
        (constraint) =>
          constraint.type === 'UNIQUE' && constraint.columns?.length === 1,
      )
      .map((constraint) => constraint.columns?.[0]),
  )
}

// Extract primary key column names from constraints
function extractPrimaryKeyColumnNames(constraints: any[] | undefined): Set<string> {
  return new Set(
    constraints
      ?.filter((constraint) => constraint.type === 'PRIMARY KEY')
      .flatMap((constraint) => constraint.columns ?? []),
  )
}

function processColumns(
  tblsColumns: any[],
  uniqueColumnNames: Set<string>,
  primaryKeyColumnNames: Set<string>,
): Columns {
  const columns: Columns = {}
  
  for (const tblsColumn of tblsColumns) {
    const defaultValue = extractDefaultValue(tblsColumn.default)

    columns[tblsColumn.name] = aColumn({
      name: tblsColumn.name,
      type: tblsColumn.type,
      notNull: !tblsColumn.nullable,
      default: defaultValue,
      primary: primaryKeyColumnNames.has(tblsColumn.name),
      comment: tblsColumn.comment ?? null,
      unique: uniqueColumnNames.has(tblsColumn.name),
    })
  }
  
  return columns
}

function processPrimaryKeyConstraint(constraint: any): any | null {
  if (
    constraint.type === 'PRIMARY KEY' &&
    constraint.columns?.length === 1 &&
    constraint.columns?.[0]
  ) {
    return {
      type: 'PRIMARY KEY',
      name: constraint.name,
      columnName: constraint.columns[0],
    }
  }
  return null
}

function processForeignKeyConstraint(constraint: any): any | null {
  if (
    constraint.type === 'FOREIGN KEY' &&
    constraint.columns?.length === 1 &&
    constraint.columns[0] &&
    constraint.referenced_columns?.length === 1 &&
    constraint.referenced_columns[0] &&
    constraint.referenced_table
  ) {
    const { updateConstraint, deleteConstraint } =
      extractForeignKeyActions(constraint.def)
    return {
      type: 'FOREIGN KEY',
      name: constraint.name,
      columnName: constraint.columns[0],
      targetTableName: constraint.referenced_table,
      targetColumnName: constraint.referenced_columns[0],
      updateConstraint,
      deleteConstraint,
    }
  }
  return null
}

function processUniqueConstraint(constraint: any): any | null {
  if (
    constraint.type === 'UNIQUE' &&
    constraint.columns?.length === 1 &&
    constraint.columns[0]
  ) {
    return {
      type: 'UNIQUE',
      name: constraint.name,
      columnName: constraint.columns[0],
    }
  }
  return null
}

function processCheckConstraint(constraint: any): any | null {
  if (constraint.type === 'CHECK') {
    return {
      type: 'CHECK',
      name: constraint.name,
      detail: constraint.def,
    }
  }
  return null
}

function processConstraints(constraints: any[] | undefined): Constraints {
  const result: Constraints = {}
  
  if (!constraints) return result
  
  for (const constraint of constraints) {
    const processedConstraint = 
      processPrimaryKeyConstraint(constraint) ||
      processForeignKeyConstraint(constraint) ||
      processUniqueConstraint(constraint) ||
      processCheckConstraint(constraint)
    
    if (processedConstraint) {
      result[constraint.name] = processedConstraint
    }
  }
  
  return result
}

function processIndexes(tblsIndexes: any[] | undefined): Indexes {
  const indexes: Indexes = {}
  
  if (!tblsIndexes) return indexes
  
  for (const tblsIndex of tblsIndexes) {
    indexes[tblsIndex.name] = anIndex({
      name: tblsIndex.name,
      columns: tblsIndex.columns,
      unique: tblsIndex.def.toLowerCase().includes('unique'),
      type:
        tblsIndex.def.toLocaleLowerCase().match(/using\s+(\w+)/)?.[1] || '',
    })
  }
  
  return indexes
}

function processTable(tblsTable: any): [string, any] {
  const uniqueColumnNames = extractUniqueColumnNames(tblsTable.constraints)
  const primaryKeyColumnNames = extractPrimaryKeyColumnNames(tblsTable.constraints)
  
  const columns = processColumns(tblsTable.columns, uniqueColumnNames, primaryKeyColumnNames)
  const constraints = processConstraints(tblsTable.constraints)
  const indexes = processIndexes(tblsTable.indexes)
  
  const table = aTable({
    name: tblsTable.name,
    columns,
    indexes,
    constraints,
    comment: tblsTable.comment ?? null,
  })
  
  return [tblsTable.name, table]
}

function processRelationships(relations: any[] | undefined): Record<string, Relationship> {
  const relationships: Record<string, Relationship> = {}
  
  if (!relations) return relationships
  
  for (const relation of relations) {
    if (!relation.parent_columns[0] || !relation.columns[0]) {
      continue
    }

    const name = defaultRelationshipName(
      relation.parent_table,
      relation.parent_columns[0],
      relation.table,
      relation.columns[0],
    )

    const actions = extractForeignKeyActions(relation.def)

    relationships[name] = aRelationship({
      name,
      primaryTableName: relation.parent_table,
      primaryColumnName: relation.parent_columns[0],
      foreignTableName: relation.table,
      foreignColumnName: relation.columns[0],
      cardinality: extractCardinality(relation.cardinality ?? ''),
      deleteConstraint: actions.deleteConstraint,
      updateConstraint: actions.updateConstraint,
    })
  }
  
  return relationships
}

async function parseTblsSchema(schemaString: string): Promise<ProcessResult> {
  const parsedSchema = JSON.parse(schemaString)
  const result = schema.safeParse(parsedSchema)

  if (!result.success) {
    return {
      value: {
        tables: {},
        relationships: {},
        tableGroups: {},
      },
      errors: [new Error(`Invalid schema format: ${result.error}`)],
    }
  }

  const tables: Tables = {}
  const tableGroups: Record<string, TableGroup> = {}
  const errors: Error[] = []

  for (const tblsTable of result.data.tables) {
    const [tableName, table] = processTable(tblsTable)
    tables[tableName] = table
  }

  const relationships = processRelationships(result.data.relations)

  return {
    value: {
      tables,
      relationships,
      tableGroups,
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
