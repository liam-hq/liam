import type { Schema, TableGroup } from '@liam-hq/db-structure'
import type { Edge, Node } from '@xyflow/react'

type Cardinality = 'ONE_TO_ONE' | 'ONE_TO_MANY'

import {
  NON_RELATED_TABLE_GROUP_NODE_ID,
  zIndex,
} from '@/features/erd/constants'
import { columnHandleId } from '@/features/erd/utils'
import type { ShowMode } from '@/schemas/showMode'
import { constraintsToRelationships } from './constraintsToRelationships'

type Params = {
  schema: Schema
  showMode: ShowMode
  tableGroups?: Record<string, TableGroup>
}

export const convertSchemaToNodes = ({
  schema,
  showMode,
  tableGroups = {},
}: Params): {
  nodes: Node[]
  edges: Edge[]
} => {
  const tables = Object.values(schema.tables)
  const relationships = constraintsToRelationships(schema.tables)

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

  // Create table group nodes
  const groupNodes: Node[] = Object.values(tableGroups).map((group) => ({
    id: `group-${group.name}`,
    type: 'tableGroup',
    data: {
      name: group.name,
      comment: group.comment,
    },
    position: { x: 0, y: 0 },
  }))

  // Create mapping of tables to their groups
  const tableToGroupMap = new Map<string, string>()
  for (const group of Object.values(tableGroups)) {
    for (const tableName of group.tables) {
      tableToGroupMap.set(tableName, `group-${group.name}`)
    }
  }

  // Create table nodes and check if any need NON_RELATED_TABLE_GROUP_NODE_ID as parent
  let hasNonRelatedTables = false
  const tableNodes = tables.map((table) => {
    const groupId = tableToGroupMap.get(table.name)
    const isNonRelatedTable =
      !tablesWithRelationships.has(table.name) && !groupId

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
        : groupId
          ? { parentId: groupId }
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
    ...groupNodes,
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
