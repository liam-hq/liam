import type { Columns, Relationships, Schema, Table, Tables } from './schema.js'

const getRemovedColumns = (
  beforeColumns: Columns,
  afterColumns: Columns,
): Columns => {
  const removedColumns: Columns = {}
  for (const colName in beforeColumns) {
    if (!(colName in afterColumns) && beforeColumns[colName]) {
      removedColumns[colName] = beforeColumns[colName]
    }
  }
  return removedColumns
}

const mergeTable = (
  beforeTable: Table | undefined,
  afterTable: Table | undefined,
) => {
  if (!afterTable && beforeTable) {
    // If only beforeTable exists, return it as is
    return beforeTable
  }

  if (!afterTable) {
    throw new Error('Both beforeTable and afterTable are undefined')
  }

  const mergedTable = { ...afterTable }

  if (beforeTable) {
    const removedColumns = getRemovedColumns(
      beforeTable.columns,
      afterTable.columns,
    )
    mergedTable.columns = {
      ...(mergedTable.columns || {}),
      ...removedColumns,
    }
  }

  return mergedTable
}

const mergeTables = (beforeTables: Tables, afterTables: Tables): Tables => {
  const mergedTables: Tables = {}
  const allTableNames = new Set<string>([
    ...Object.keys(beforeTables),
    ...Object.keys(afterTables),
  ])

  allTableNames.forEach((tableName) => {
    const beforeTable = beforeTables[tableName]
    const afterTable = afterTables[tableName]

    if (afterTable || beforeTable) {
      mergedTables[tableName] = mergeTable(beforeTable, afterTable)
    }
  })

  return mergedTables
}

const mergeRelationships = (
  beforeRelationships: Relationships,
  afterRelationships: Relationships,
): Relationships => {
  const mergedRelationships: Relationships = {}
  const allRelationshipNames = new Set<string>([
    ...Object.keys(beforeRelationships),
    ...Object.keys(afterRelationships),
  ])

  allRelationshipNames.forEach((relName) => {
    const afterRel = afterRelationships[relName]
    if (afterRel) {
      mergedRelationships[relName] = { ...afterRel }
    }
  })

  return mergedRelationships
}

export function mergeSchemas(before: Schema, after: Schema): Schema {
  return {
    tables: mergeTables(before.tables, after.tables),
    relationships: mergeRelationships(
      before.relationships,
      after.relationships,
    ),
  }
}
