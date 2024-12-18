import type { ShowMode } from '@/schemas/showMode'
import type { Cardinality, DBStructure } from '@liam-hq/db-structure'
import type { Edge, Node } from '@xyflow/react'
import { columnHandleId } from './columnHandleId'

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
  const sourceColumns = new Map<string, string>()
  const tableColumnCardinalities = new Map<
    string,
    Record<string, Cardinality>
  >()
  for (const relationship of relationships) {
    sourceColumns.set(
      relationship.primaryTableName,
      relationship.primaryColumnName,
    )
    tableColumnCardinalities.set(relationship.foreignTableName, {
      ...tableColumnCardinalities.get(relationship.foreignTableName),
      [relationship.foreignColumnName]: relationship.cardinality,
    })
  }

  const nodes: Node[] = tables.map((table) => {
    return {
      id: table.name,
      type: 'table',
      data: {
        table,
        sourceColumnName: sourceColumns.get(table.name),
        targetColumnCardinalities: tableColumnCardinalities.get(table.name),
      },
      position: { x: 0, y: 0 },
      zIndex: 1,
    }
  })

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
      cardinality: showMode === 'ALL_FIELDS' ? rel.cardinality : undefined,
    },
  }))

  return { nodes, edges }
}
