import {
  NON_RELATED_TABLE_GROUP_NODE_ID,
  zIndex,
} from '@/features/erd/constants'
import { columnHandleId } from '@/features/erd/utils'
import type { ShowMode } from '@/schemas/showMode'
import type { Cardinality, Schema, TableGroup } from '@liam-hq/db-structure'
import type { Edge, Node } from '@xyflow/react'

// Define a simplified type for implementation requests
// biome-ignore lint/suspicious/noExplicitAny: needed for poc
type ProcessedRequest = any & {
  status?: string
  id: string
  tables?: {
    // biome-ignore lint/suspicious/noExplicitAny: needed for poc
    add?: Record<string, any>
  }
  relationships?: {
    // biome-ignore lint/suspicious/noExplicitAny: needed for poc
    add?: Record<string, any>
  }
}

// We're simplifying the type to use a single array of requests
export type ProcessedRequests = {
  // For backward compatibility with the rest of the application
  openRequests: ProcessedRequest[]
  inProgressRequests: ProcessedRequest[]
  doneRequests: ProcessedRequest[]
  wontfixRequests: ProcessedRequest[]
  // New property that combines all requests
  allRequests?: ProcessedRequest[]
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

  // Track tables that are part of requests
  const requestedTableNames = new Set<string>()
  // biome-ignore lint/suspicious/noExplicitAny: needed for poc
  const requestedTableData = new Map<string, { request: any; status: string }>()

  // Process implementation requests if available to identify requested tables
  if (implementationRequests) {
    // Use allRequests if available, otherwise combine the separate arrays
    const allRequests = implementationRequests.allRequests || [
      ...(implementationRequests.openRequests || []),
      ...(implementationRequests.inProgressRequests || []),
      ...(implementationRequests.doneRequests || []),
      ...(implementationRequests.wontfixRequests || []),
    ]

    // First pass: identify all tables that are part of requests
    for (const request of allRequests) {
      const status = request.status || 'unknown'

      if (request.tables?.add) {
        for (const tableName of Object.keys(request.tables.add)) {
          requestedTableNames.add(tableName)
          requestedTableData.set(tableName, { request, status })
        }
      }
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
      const isRequestedTable = requestedTableNames.has(table.name)
      const requestData = requestedTableData.get(table.name)

      return {
        id: table.name,
        // Use requestedTable type if the table is part of a request
        type: isRequestedTable ? 'requestedTable' : 'table',
        data: {
          table,
          sourceColumnName: sourceColumns.get(table.name),
          targetColumnCardinalities: tableColumnCardinalities.get(table.name),
          // Add request data if this is a requested table
          ...(isRequestedTable && {
            request: requestData?.request,
            status: requestData?.status,
          }),
        },
        position: { x: 0, y: 0 },
        // Update ariaLabel for requested tables
        ariaLabel: isRequestedTable
          ? `Requested table (${requestData?.status}): ${table.name}`
          : `${table.name} table`,
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
    // Use allRequests if available, otherwise combine the separate arrays
    const allRequests = implementationRequests.allRequests || [
      ...(implementationRequests.openRequests || []),
      ...(implementationRequests.inProgressRequests || []),
      ...(implementationRequests.doneRequests || []),
      ...(implementationRequests.wontfixRequests || []),
    ]

    // Process all requests in a single loop
    for (const request of allRequests) {
      // Get the request status (default to 'unknown' if not available)
      const status = request.status || 'unknown'

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
              status,
            },
            position: { x: 0, y: 0 },
            ariaLabel: `Requested table (${status}): ${tableName}`,
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
              status,
              cardinality: rel.cardinality,
            },
          })
        }
      }
    }
  }

  return { nodes, edges }
}
