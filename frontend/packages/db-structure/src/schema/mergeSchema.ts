import { err, ok, type Result } from 'neverthrow'
import type { Columns, Schema, Table, Tables } from './schema.js'

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
): Result<Table, Error> => {
  if (!afterTable && beforeTable) {
    // If only beforeTable exists, return it as is
    return ok(beforeTable)
  }

  if (!afterTable) {
    return err(new Error('Both beforeTable and afterTable are undefined'))
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

  return ok(mergedTable)
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
      const mergeResult = mergeTable(beforeTable, afterTable)
      if (mergeResult.isErr()) {
        throw mergeResult.error
      }
      mergedTables[tableName] = mergeResult.value
    }
  })

  return mergedTables
}

export function mergeSchemas(before: Schema, after: Schema): Schema {
  return {
    tables: mergeTables(before.tables, after.tables),
  }
}
