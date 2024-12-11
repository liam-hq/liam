import type {
  DBStructure,
  Relationships,
  Table,
  Tables,
} from '@liam-hq/db-structure'

export const extractDBStructureForTable = (
  table: Table,
  dbStructure: DBStructure,
): DBStructure => {
  const relatedRelationshipsArray = Object.values(
    dbStructure.relationships,
  ).filter(
    (relationship) =>
      relationship.primaryTableName === table.name ||
      relationship.foreignTableName === table.name,
  )

  const relatedRelationships: Relationships = {}
  for (const relationship of relatedRelationshipsArray) {
    relatedRelationships[relationship.name] = relationship
  }

  const relatedTableNames = new Set<string>()
  for (const relationship of Object.values(relatedRelationships)) {
    relatedTableNames.add(relationship.primaryTableName)
    relatedTableNames.add(relationship.foreignTableName)
  }

  const relatedTablesArray = Object.values(dbStructure.tables).filter((tbl) =>
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
