import type { Cardinality, Schema } from '@liam-hq/db-structure'
import type { Edge, Node } from '@xyflow/react'
import {
  NON_RELATED_TABLE_GROUP_NODE_ID,
  zIndex,
} from '@/features/erd/constants'
import { columnHandleId } from '@/features/erd/utils'
import type { ShowMode } from '@/schemas/showMode'

type Params = {
  schema: Schema
  showMode: ShowMode
}

export const convertSchemaToNodes = ({
  schema,
  showMode,
}: Params): {
  nodes: Node[]
  edges: Edge[]
} => {
  const tables = Object.values(schema.tables)
  const relationships = Object.values(schema.relationships)

  const tablesWithRelationships = new Set<string>()
  const sourceColumns = new Map<string, string>()
  const tableColumnCardinalities = new Map<
    string,
    Record<string, Cardinality>
  >()
  for (const relationship of relationships) {
    tablesWithRelationships.add(relationship.primaryTableName)
    tablesWithRelationships.add(relationship.foreignTableName)
    sourceColumns.set(
      relationship.primaryTableName,
      relationship.primaryColumnName,
    )
    tableColumnCardinalities.set(relationship.foreignTableName, {
      ...tableColumnCardinalities.get(relationship.foreignTableName),
      [relationship.foreignColumnName]: relationship.cardinality,
    })
  }

  // Create table nodes and check if any need NON_RELATED_TABLE_GROUP_NODE_ID as parent
  let hasNonRelatedTables = false
  const tableNodes = tables.map((table) => {
    const isNonRelatedTable = !tablesWithRelationships.has(table.name)

    if (isNonRelatedTable) {
      hasNonRelatedTables = true
    }

    return {
      id: table.name,
      type: 'table',
      data: {
        table,
        sourceColumnName: sourceColumns.get(table.name),
        targetColumnCardinalities: tableColumnCardinalities.get(table.name),
      },
      position: { x: 0, y: 0 },
      ariaLabel: `${table.name} table`,
      zIndex: zIndex.nodeDefault,
      ...(isNonRelatedTable
        ? { parentId: NON_RELATED_TABLE_GROUP_NODE_ID }
        : {}),
    }
  })

  // Only include NON_RELATED_TABLE_GROUP_NODE_ID if there are tables that need it
  const nodes: Node[] = [
    ...(hasNonRelatedTables
      ? [
          {
            id: NON_RELATED_TABLE_GROUP_NODE_ID,
            type: 'nonRelatedTableGroup',
            data: {},
            position: { x: 0, y: 0 },
          },
        ]
      : []),
    ...tableNodes,
  ]

  const edges: Edge[] = relationships.map((rel) => ({
    id: rel.name,
    type: 'relationship',
    source: rel.primaryTableName,
    target: rel.foreignTableName,
    sourceHandle:
      showMode === 'TABLE_NAME'
        ? null
        : columnHandleId(rel.primaryTableName, rel.primaryColumnName),
    targetHandle:
      showMode === 'TABLE_NAME'
        ? null
        : columnHandleId(rel.foreignTableName, rel.foreignColumnName),
    data: {
      relationship: rel,
      cardinality: rel.cardinality,
    },
  }))

  return { nodes, edges }
}
