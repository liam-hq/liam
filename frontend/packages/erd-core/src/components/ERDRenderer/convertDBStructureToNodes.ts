import type { ShowMode } from '@/schemas/showMode'
import type { DBStructure } from '@liam-hq/db-structure'
import type { Edge, Node } from '@xyflow/react'

const VERTICAL_CONTAINER_NODE_ID = 'vertical-container'

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

  const nodes: Node[] = [
    {
      id: VERTICAL_CONTAINER_NODE_ID,
      type: 'verticalContainer',
      data: {},
      position: { x: 0, y: 0 },
      style: {
        opacity: 0,
      },
    },
  ]

  const tablesWithRelationships = new Set<string>()
  for (const rel of relationships) {
    tablesWithRelationships.add(rel.primaryTableName)
    tablesWithRelationships.add(rel.foreignTableName)
  }

  for (const table of tables) {
    const newNode: Node = {
      id: table.name,
      type: 'table',
      data: {
        table,
      },
      position: { x: 0, y: 0 },
      zIndex: 1,
    }

    if (!tablesWithRelationships.has(table.name)) {
      newNode.parentId = VERTICAL_CONTAINER_NODE_ID
    }

    nodes.push(newNode)
  }

  const edges: Edge[] = relationships.map((rel) => ({
    id: rel.name,
    type: 'relationship',
    source: rel.primaryTableName,
    target: rel.foreignTableName,
    sourceHandle:
      showMode === 'TABLE_NAME'
        ? null
        : `${rel.primaryTableName}-${rel.primaryColumnName}`,
    targetHandle:
      showMode === 'TABLE_NAME'
        ? null
        : `${rel.foreignTableName}-${rel.foreignColumnName}`,
    data: { relationship: rel },
  }))

  return { nodes, edges }
}
