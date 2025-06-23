import type {
  ForeignKeyConstraint,
  Schema,
  Tables,
} from '@liam-hq/db-structure'

type Cardinality = 'ONE_TO_ONE' | 'ONE_TO_MANY'

type DisplayRelationship = {
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

const constraintsToRelationships = (tables: Tables): DisplayRelationship[] => {
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

// Convert table data to text document
const tableToDocument = (
  tableName: string,
  tableData: Schema['tables'][string],
): string => {
  // Table description
  const tableDescription = `Table: ${tableName}\nDescription: ${tableData.comment || 'No description'}\n`

  // Columns information
  let columnsText = 'Columns:\n'
  if (tableData.columns) {
    for (const [columnName, columnData] of Object.entries(tableData.columns)) {
      columnsText += `- ${columnName}: ${columnData.type || 'unknown type'} ${!columnData.notNull ? '(nullable)' : '(not nullable)'}\n`
      if (columnData.comment) {
        columnsText += `  Description: ${columnData.comment}\n`
      }
    }
  }

  // Primary key information
  let primaryKeyText = ''
  const primaryKeyColumns = Object.entries(tableData.columns || {})
    .filter(([_, column]) => column.primary)
    .map(([name]) => name)

  if (primaryKeyColumns.length > 0) {
    primaryKeyText = `Primary Key: ${primaryKeyColumns.join(', ')}\n`
  }

  // Combine all information
  return `${tableDescription}${columnsText}${primaryKeyText}`
}

// Convert relationship data to text document
const relationshipToDocument = (
  relationshipName: string,
  relationshipData: DisplayRelationship,
): string => {
  return `Relationship: ${relationshipName}
From Table: ${relationshipData.primaryTableName}
From Column: ${relationshipData.primaryColumnName}
To Table: ${relationshipData.foreignTableName}
To Column: ${relationshipData.foreignColumnName}
Type: ${relationshipData.cardinality || 'unknown'}\n`
}

// Convert table groups to text document
const tableGroupsToText = (
  tableGroups: Schema['tableGroups'] | undefined,
): string => {
  if (!tableGroups) return ''

  let tableGroupsText = ''

  for (const [groupId, groupData] of Object.entries(tableGroups)) {
    tableGroupsText += `Group ID: ${groupId}\n`

    if (groupData.name) {
      tableGroupsText += `Name: ${String(groupData.name)}\n`
    }

    if (groupData.tables && Array.isArray(groupData.tables)) {
      tableGroupsText += `Tables: ${groupData.tables.join(', ')}\n`
    }

    tableGroupsText += '\n'
  }

  return tableGroupsText
}

// Convert schema data to text format
export const convertSchemaToText = (schema: Schema): string => {
  let schemaText = 'FULL DATABASE SCHEMA:\n\n'

  // Process tables
  if (schema.tables) {
    schemaText += 'TABLES:\n\n'
    for (const [tableName, tableData] of Object.entries(schema.tables)) {
      const tableDoc = tableToDocument(tableName, tableData)
      schemaText = `${schemaText}${tableDoc}\n\n`
    }
  }

  // Process relationships (generated from constraints)
  const relationships = constraintsToRelationships(schema.tables)
  if (relationships.length > 0) {
    schemaText += 'RELATIONSHIPS:\n\n'
    for (const relationshipData of relationships) {
      const relationshipDoc = relationshipToDocument(
        relationshipData.name,
        relationshipData,
      )
      schemaText = `${schemaText}${relationshipDoc}\n\n`
    }
  }

  // Process table groups
  if (schema.tableGroups && Object.keys(schema.tableGroups).length > 0) {
    schemaText += 'TABLE GROUPS:\n\n'
    const tableGroupsText = tableGroupsToText(schema.tableGroups)
    schemaText = `${schemaText}${tableGroupsText}\n`
  }

  return schemaText
}
