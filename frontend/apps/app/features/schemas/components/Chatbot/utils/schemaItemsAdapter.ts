import type {
  SchemaData,
  TableGroupData,
} from '../../../../../app/api/chat/route'

export interface SchemaItem {
  id: string
  label: string
  description: string
  type: 'tableGroup' | 'table' | 'column'
  icon: string // Display icon (📁, 📄, 🔹)
}

/**
 * Converts schema data to a list of mentionable items
 */
export function convertSchemaToMentionItems(
  schemaData: SchemaData,
  tableGroups?: Record<string, TableGroupData>,
): SchemaItem[] {
  const items: SchemaItem[] = []

  // Table Groups
  if (tableGroups) {
    for (const [id, group] of Object.entries(tableGroups)) {
      items.push({
        id,
        label: group.name || id,
        description:
          group.comment ||
          `Table Group containing ${group.tables?.length || 0} tables`,
        type: 'tableGroup',
        icon: '📁',
      })
    }
  }

  // Tables
  if (schemaData.tables) {
    for (const [tableName, tableData] of Object.entries(schemaData.tables)) {
      items.push({
        id: tableName,
        label: tableName,
        description:
          tableData.description ||
          `Table with ${Object.keys(tableData.columns || {}).length} columns`,
        type: 'table',
        icon: '📄',
      })

      // Columns
      if (tableData.columns) {
        for (const [columnName, columnData] of Object.entries(
          tableData.columns,
        )) {
          items.push({
            id: `${tableName}.${columnName}`,
            label: `${tableName}.${columnName}`,
            description: `${columnData.type}${columnData.nullable ? ' (nullable)' : ''}${columnData.description ? ` - ${columnData.description}` : ''}`,
            type: 'column',
            icon: '🔹',
          })
        }
      }
    }
  }

  // Sort items by type priority: tableGroup, table, column
  return items.sort((a, b) => {
    const typeOrder = { tableGroup: 0, table: 1, column: 2 }
    return typeOrder[a.type] - typeOrder[b.type]
  })
}
