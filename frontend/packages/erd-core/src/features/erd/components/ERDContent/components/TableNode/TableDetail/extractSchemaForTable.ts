import type {
  Relationships,
  Schema,
  Table,
  Tables,
} from '@liam-hq/db-structure'

export const extractSchemaForTable = (table: Table, schema: Schema): Schema => {
  const relatedRelationshipsArray = Object.values(schema.relationships).filter(
    (relationship) =>
      relationship.primaryTableName === table.name ||
      relationship.foreignTableName === table.name,
  )

  if (relatedRelationshipsArray.length === 0) {
    return {
      tables: {
        [table.name]: table,
      },
      relationships: {},
    }
  }

  const relatedRelationships: Relationships = {}
  for (const relationship of relatedRelationshipsArray) {
    relatedRelationships[relationship.name] = relationship
  }

  const relatedTableNames = new Set<string>()
  for (const relationship of Object.values(relatedRelationships)) {
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
    relationships: relatedRelationships,
  }
}
