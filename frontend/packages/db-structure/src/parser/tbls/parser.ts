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
  const relationships: Record<string, Relationship> = {}
  const tableGroups: Record<string, TableGroup> = {}
  const errors: Error[] = []

  for (const tblsTable of result.data.tables) {
    const columns: Columns = {}
    const indexes: Indexes = {}
    const constraints: Constraints = {}

    const uniqueColumnNames = new Set(
      tblsTable.constraints
        ?.filter(
          (constraint) =>
            constraint.type === 'UNIQUE' && constraint.columns?.length === 1,
        )
        .map((constraint) => constraint.columns?.[0]),
    )

    const primaryKeyColumnNames = new Set(
      tblsTable.constraints
        ?.filter((constraint) => constraint.type === 'PRIMARY KEY')
        .flatMap((constraint) => constraint.columns ?? []),
    )

    for (const tblsColumn of tblsTable.columns) {
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

    if (tblsTable.constraints) {
      for (const constraint of tblsTable.constraints) {
        if (
          constraint.type === 'PRIMARY KEY' &&
          constraint.columns?.length === 1 &&
          constraint.columns?.[0]
        ) {
          constraints[constraint.name] = {
            type: 'PRIMARY KEY',
            name: constraint.name,
            columnName: constraint.columns[0],
          }
        }

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
          constraints[constraint.name] = {
            type: 'FOREIGN KEY',
            name: constraint.name,
            columnName: constraint.columns[0],
            targetTableName: constraint.referenced_table,
            targetColumnName: constraint.referenced_columns[0],
            updateConstraint,
            deleteConstraint,
          }
        }

        if (
          constraint.type === 'UNIQUE' &&
          constraint.columns?.length === 1 &&
          constraint.columns[0]
        ) {
          constraints[constraint.name] = {
            type: 'UNIQUE',
            name: constraint.name,
            columnName: constraint.columns[0],
          }
        }

        if (constraint.type === 'CHECK') {
          constraints[constraint.name] = {
            type: 'CHECK',
            name: constraint.name,
            detail: constraint.def,
          }
        }
      }
    }

    if (tblsTable.indexes) {
      for (const tblsIndex of tblsTable.indexes) {
        indexes[tblsIndex.name] = anIndex({
          name: tblsIndex.name,
          columns: tblsIndex.columns,
          unique: tblsIndex.def.toLowerCase().includes('unique'),
          type:
            tblsIndex.def.toLocaleLowerCase().match(/using\s+(\w+)/)?.[1] || '',
        })
      }
    }

    tables[tblsTable.name] = aTable({
      name: tblsTable.name,
      columns,
      indexes,
      constraints,
      comment: tblsTable.comment ?? null,
    })
  }

  if (result.data.relations) {
    for (const relation of result.data.relations) {
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
  }

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
