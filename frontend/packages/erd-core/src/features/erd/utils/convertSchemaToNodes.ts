import {
  NON_RELATED_TABLE_GROUP_NODE_ID,
  zIndex,
} from '@/features/erd/constants'
import { columnHandleId } from '@/features/erd/utils'
import type { ShowMode } from '@/schemas/showMode'
import type { Cardinality, Schema, TableGroup } from '@liam-hq/db-structure'
import type { Edge, Node } from '@xyflow/react'

// Define a simplified type for implementation requests
export type ProcessedRequests = {
  // biome-ignore lint/suspicious/noExplicitAny: needed for poc
  openRequests: any[]
  // biome-ignore lint/suspicious/noExplicitAny: needed for poc
  inProgressRequests: any[]
  // biome-ignore lint/suspicious/noExplicitAny: needed for poc
  doneRequests: any[]
  // biome-ignore lint/suspicious/noExplicitAny: needed for poc
  wontfixRequests: any[]
}

type Params = {
  schema: Schema
  showMode: ShowMode
  tableGroups?: Record<string, TableGroup>
  implementationRequests?: ProcessedRequests | undefined
}

export const convertSchemaToNodes = ({
  schema,
  showMode,
  tableGroups = {},
  implementationRequests,
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

  const nodes: Node[] = [
    {
      id: NON_RELATED_TABLE_GROUP_NODE_ID,
      type: 'nonRelatedTableGroup',
      data: {},
      position: { x: 0, y: 0 },
    },
    ...groupNodes,
    ...tables.map((table) => {
      const groupId = tableToGroupMap.get(table.name)

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
        ...(!tablesWithRelationships.has(table.name) && !groupId
          ? { parentId: NON_RELATED_TABLE_GROUP_NODE_ID }
          : groupId
            ? { parentId: groupId }
            : {}),
      }
    }),
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

  // Process implementation requests if available
  if (implementationRequests) {
    // Process open requests
    for (const request of implementationRequests.openRequests) {
      // Add tables from requests
      if (request.tables?.add) {
        for (const [tableName, tableAddReq] of Object.entries(
          request.tables.add,
        )) {
          // Skip if table already exists
          if (schema.tables[tableName]) continue

          // Type assertion for tableAddRequest
          // biome-ignore lint/suspicious/noExplicitAny: needed for poc
          const tableAddRequest = tableAddReq as any

          // Create a node for the requested table
          nodes.push({
            id: `request-${request.id}-table-${tableName}`,
            type: 'requestedTable',
            data: {
              table: tableAddRequest.definition,
              request,
              status: 'open',
            },
            position: { x: 0, y: 0 },
            ariaLabel: `Requested table: ${tableName}`,
            zIndex: zIndex.nodeDefault,
          })
        }
      }

      // Add relationships from requests
      if (request.relationships?.add) {
        for (const [relationshipName, relationshipAddReq] of Object.entries(
          request.relationships.add,
        )) {
          // Skip if relationship already exists
          if (schema.relationships[relationshipName]) continue

          // Type assertion for relationshipAddRequest
          // biome-ignore lint/suspicious/noExplicitAny: needed for poc
          const relationshipAddRequest = relationshipAddReq as any
          const rel = relationshipAddRequest.definition
          edges.push({
            id: `request-${request.id}-relationship-${relationshipName}`,
            type: 'requestedRelationship',
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
              request,
              status: 'open',
              cardinality: rel.cardinality,
            },
          })
        }
      }
    }

    // Process in-progress requests
    for (const request of implementationRequests.inProgressRequests) {
      // Similar processing as open requests, but with 'in_progress' status
      // Add tables from requests
      if (request.tables?.add) {
        for (const [tableName, tableAddReq] of Object.entries(
          request.tables.add,
        )) {
          // Skip if table already exists
          if (schema.tables[tableName]) continue

          // Type assertion for tableAddRequest
          // biome-ignore lint/suspicious/noExplicitAny: needed for poc
          const tableAddRequest = tableAddReq as any

          // Create a node for the requested table
          nodes.push({
            id: `request-${request.id}-table-${tableName}`,
            type: 'requestedTable',
            data: {
              table: tableAddRequest.definition,
              request,
              status: 'in_progress',
            },
            position: { x: 0, y: 0 },
            ariaLabel: `Requested table (in progress): ${tableName}`,
            zIndex: zIndex.nodeDefault,
          })
        }
      }

      // Add relationships from requests
      if (request.relationships?.add) {
        for (const [relationshipName, relationshipAddReq] of Object.entries(
          request.relationships.add,
        )) {
          // Skip if relationship already exists
          if (schema.relationships[relationshipName]) continue

          // Type assertion for relationshipAddRequest
          // biome-ignore lint/suspicious/noExplicitAny: needed for poc
          const relationshipAddRequest = relationshipAddReq as any
          const rel = relationshipAddRequest.definition
          edges.push({
            id: `request-${request.id}-relationship-${relationshipName}`,
            type: 'requestedRelationship',
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
              request,
              status: 'in_progress',
              cardinality: rel.cardinality,
            },
          })
        }
      }
    }
  }

  return { nodes, edges }
}
