import type { DBStructure } from '@liam-hq/db-structure'
import type { Edge, Node } from '@xyflow/react'
import { nanoid } from 'nanoid'

export const convertDBStructureToNodes = (
  dbStructure: DBStructure,
): { nodes: Node[]; edges: Edge[] } => {
  const tables = Object.values(dbStructure.tables)
  const relationships = Object.values(dbStructure.relationships)

  const nodes: Node[] = tables.map((table) => {
    return {
      id: table.name,
      type: 'table',
      data: {
        table,
      },
      position: { x: 0, y: 0 },
      style: {
        opacity: 0,
      },
    }
  })

  const edges = relationships.map((rel) => ({
    id: rel.name !== '' ? rel.name : nanoid(),
    type: 'relationship',
    source: rel.primaryTableName,
    target: rel.foreignTableName,
    sourceHandle: `${rel.primaryTableName}-${rel.primaryColumnName}`,
    targetHandle: `${rel.foreignTableName}-${rel.foreignColumnName}`,
    data: { relationship: rel },
    style: {
      opacity: 0,
    },
  }))

  return { nodes, edges }
}
