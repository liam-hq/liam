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

// Simplified type for requests - just a single array
export type ProcessedRequests = {
  // Single array of all requests
  allRequests: ProcessedRequest[]
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
  const requestedTableData = new Map<string, { request: any }>()

  // Process implementation requests if available to identify requested tables
  if (implementationRequests?.allRequests) {
    // First pass: identify all tables that are part of requests
    for (const request of implementationRequests.allRequests) {
      if (request.tables?.add) {
        for (const tableName of Object.keys(request.tables.add)) {
          requestedTableNames.add(tableName)
          requestedTableData.set(tableName, { request })
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
          }),
        },
        position: { x: 0, y: 0 },
        // Update ariaLabel for requested tables
        ariaLabel: isRequestedTable
          ? `Requested table: ${table.name}`
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
  if (implementationRequests?.allRequests) {
    // Track tables and relationships that have been added by requests
    // This helps us avoid duplicates when processing multiple requests
    const addedTables = new Set<string>()
    const addedRelationships = new Set<string>()

    // Store relationship data to process after all tables
    type RelationshipData = {
      relationshipName: string
      // biome-ignore lint/suspicious/noExplicitAny: needed for poc
      relationshipAddRequest: any
      // biome-ignore lint/suspicious/noExplicitAny: needed for poc
      request: any
    }
    const relationshipsToProcess: RelationshipData[] = []

    // First pass: Process all tables from all requests
    for (const request of implementationRequests.allRequests) {
      // Add tables from requests
      if (request.tables?.add) {
        for (const [tableName, tableAddReq] of Object.entries(
          request.tables.add,
        )) {
          // Skip if table already exists in schema or was added by a previous request
          if (schema.tables[tableName] || addedTables.has(tableName)) {
            // If the table exists but was not added by a previous request,
            // it's a regular table in the schema, so we don't need to do anything
            continue
          }

          // Mark this table as added
          addedTables.add(tableName)

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
            },
            position: { x: 0, y: 0 },
            ariaLabel: `Requested table: ${tableName}`,
            zIndex: zIndex.nodeDefault,
          })
        }
      }

      // Collect relationships to process later
      if (request.relationships?.add) {
        for (const [relationshipName, relationshipAddReq] of Object.entries(
          request.relationships.add,
        )) {
          // Skip if relationship already exists in schema or was added by a previous request
          if (
            schema.relationships[relationshipName] ||
            addedRelationships.has(relationshipName)
          ) {
            // If the relationship exists but was not added by a previous request,
            // it's a regular relationship in the schema, so we don't need to do anything
            continue
          }

          // Mark this relationship as added to avoid duplicates
          addedRelationships.add(relationshipName)

          // Store relationship data for later processing
          relationshipsToProcess.push({
            relationshipName,
            relationshipAddRequest: relationshipAddReq,
            request,
          })
        }
      }
    }

    // Second pass: Process all relationships after all tables have been added
    for (const {
      relationshipName,
      relationshipAddRequest,
      request,
    } of relationshipsToProcess) {
      // Type assertion for relationshipAddRequest
      const rel = relationshipAddRequest.definition

      // Check if both source and target tables exist (either in schema or added by requests)
      const sourceTableExists =
        schema.tables[rel.primaryTableName] ||
        addedTables.has(rel.primaryTableName)
      const targetTableExists =
        schema.tables[rel.foreignTableName] ||
        addedTables.has(rel.foreignTableName)

      // Only add the relationship if both tables exist
      if (sourceTableExists && targetTableExists) {
        // Determine the correct target ID based on whether the target table is a requested table or a regular table
        // If the target table is in the schema, use its name directly
        // If the target table was added by a request, use the request-specific ID format
        const targetId = schema.tables[rel.foreignTableName]
          ? rel.foreignTableName
          : `request-${request.id}-table-${rel.foreignTableName}`

        edges.push({
          id: `request-${request.id}-relationship-${relationshipName}`,
          type: 'relationship', // Use 'relationship' type since RequestedRelationshipEdge is not used
          source: rel.primaryTableName,
          target: targetId,
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
            cardinality: rel.cardinality,
            isHighlighted: false,
            isRequested: true, // Mark as a requested relationship
          },
          style: {
            strokeDasharray: '5,5', // Dashed line for requested relationships
            stroke: 'rgba(0, 100, 255, 0.6)', // Blue color for requested relationships
          },
        })
      }
    }
  }

  return { nodes, edges }
}
