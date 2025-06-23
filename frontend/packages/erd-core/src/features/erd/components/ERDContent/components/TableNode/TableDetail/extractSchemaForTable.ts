import type { Schema, Table, Tables } from '@liam-hq/db-structure'
import { constraintsToRelationships } from '../../../../../utils'

export const extractSchemaForTable = (table: Table, schema: Schema): Schema => {
  const relationships = constraintsToRelationships(schema.tables)
  const relatedRelationshipsArray = relationships.filter(
    (relationship) =>
      relationship.primaryTableName === table.name ||
      relationship.foreignTableName === table.name,
  )

  if (relatedRelationshipsArray.length === 0) {
    return {
      tables: {
        [table.name]: table,
      },
      tableGroups: {},
    }
  }

  const relatedTableNames = new Set<string>()
  for (const relationship of relatedRelationshipsArray) {
    relatedTableNames.add(relationship.primaryTableName)
    relatedTableNames.add(relationship.foreignTableName)
  }

  const relatedTablesArray = Object.values(schema.tables).filter((tbl) =>
    relatedTableNames.has(tbl.name),
  )

  const relatedTables: Tables = {}
  for (const tbl of relatedTablesArray) {
    relatedTables[tbl.name] = tbl
  }

  return {
    tables: relatedTables,
    tableGroups: {},
  }
}
