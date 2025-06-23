import type { ForeignKeyConstraint, Tables } from '@liam-hq/db-structure'

type Cardinality = 'ONE_TO_ONE' | 'ONE_TO_MANY'

export type DisplayRelationship = {
  name: string
  primaryTableName: string
  primaryColumnName: string
  foreignTableName: string
  foreignColumnName: string
  cardinality: Cardinality
}

const inferCardinality = (
  tables: Tables,
  constraint: ForeignKeyConstraint,
  foreignTableName: string,
): Cardinality => {
  // Check if the foreign key column has unique constraint or is primary key
  const foreignTable = tables[foreignTableName]
  if (!foreignTable) {
    return 'ONE_TO_MANY'
  }

  const foreignColumn = foreignTable.columns[constraint.columnName]
  if (!foreignColumn) {
    return 'ONE_TO_MANY'
  }

  // If the foreign key column is primary key or unique, it's ONE_TO_ONE
  if (foreignColumn.primary || foreignColumn.unique) {
    return 'ONE_TO_ONE'
  }

  // Check if there's a unique constraint on this column
  const hasUniqueConstraint = Object.values(foreignTable.constraints).some(
    (c) =>
      c.type === 'UNIQUE' &&
      'columnName' in c &&
      c.columnName === constraint.columnName,
  )

  return hasUniqueConstraint ? 'ONE_TO_ONE' : 'ONE_TO_MANY'
}

export const constraintsToRelationships = (
  tables: Tables,
): DisplayRelationship[] => {
  const relationships: DisplayRelationship[] = []

  // Process each table's constraints
  for (const [tableName, table] of Object.entries(tables)) {
    for (const constraint of Object.values(table.constraints)) {
      if (constraint.type === 'FOREIGN KEY') {
        const foreignKeyConstraint = constraint as ForeignKeyConstraint

        relationships.push({
          name: foreignKeyConstraint.name,
          primaryTableName: foreignKeyConstraint.targetTableName,
          primaryColumnName: foreignKeyConstraint.targetColumnName,
          foreignTableName: tableName,
          foreignColumnName: foreignKeyConstraint.columnName,
          cardinality: inferCardinality(
            tables,
            foreignKeyConstraint,
            tableName,
          ),
        })
      }
    }
  }

  return relationships
}
