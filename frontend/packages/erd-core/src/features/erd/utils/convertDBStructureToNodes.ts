import { zIndex } from '@/features/erd/constants'
import { columnHandleId } from '@/features/erd/utils'
import type { ShowMode } from '@/schemas/showMode'
import type { Cardinality, DBStructure } from '@liam-hq/db-structure'
import type { Edge, Node } from '@xyflow/react'

export const NON_RELATED_TABLE_GROUP_NODE_ID = 'non-related-table-group'

type Params = {
  dbStructure: DBStructure
  showMode: ShowMode
}

export const convertDBStructureToNodes = ({
  dbStructure,
  showMode,
}: Params): {
  nodes: Node[]
  edges: Edge[]
} => {
  const tables = Object.values(dbStructure.tables)
  const relationships = Object.values(dbStructure.relationships)

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

  const nodes: Node[] = [
    {
      id: NON_RELATED_TABLE_GROUP_NODE_ID,
      type: 'nonRelatedTableGroup',
      data: {},
      position: { x: 0, y: 0 },
    },
    ...tables.map((table) => ({
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
      ...(!tablesWithRelationships.has(table.name)
        ? { parentId: NON_RELATED_TABLE_GROUP_NODE_ID }
        : {}),
    })),
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
