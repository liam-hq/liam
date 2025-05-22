import { mastra } from '@/lib/mastra'
import { classifyQuestion } from '@/lib/mastra/agents'
import type { Schema, TableGroup } from '@liam-hq/db-structure'
import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'

// Export TableGroupData type for compatibility
export type TableGroupData = TableGroup

// Convert table data to text document
const tableToDocument = (
  tableName: string,
  tableData: Schema['tables'][string],
): string => {
  // Table description
  const tableDescription = `Table: ${tableName}\nDescription: ${tableData.comment || 'No description'}\n`

  // Columns information
  let columnsText = 'Columns:\n'
  if (tableData.columns) {
    for (const [columnName, columnData] of Object.entries(tableData.columns)) {
      columnsText += `- ${columnName}: ${columnData.type || 'unknown type'} ${!columnData.notNull ? '(nullable)' : '(not nullable)'}\n`
      if (columnData.comment) {
        columnsText += `  Description: ${columnData.comment}\n`
      }
    }
  }

  // Primary key information
  let primaryKeyText = ''
  const primaryKeyColumns = Object.entries(tableData.columns || {})
    .filter(([_, column]) => column.primary)
    .map(([name]) => name)

  if (primaryKeyColumns.length > 0) {
    primaryKeyText = `Primary Key: ${primaryKeyColumns.join(', ')}\n`
  }

  // Combine all information
  return `${tableDescription}${columnsText}${primaryKeyText}`
}

// Convert relationship data to text document
const relationshipToDocument = (
  relationshipName: string,
  relationshipData: Schema['relationships'][string],
): string => {
  return `Relationship: ${relationshipName}
From Table: ${relationshipData.primaryTableName}
From Column: ${relationshipData.primaryColumnName}
To Table: ${relationshipData.foreignTableName}
To Column: ${relationshipData.foreignColumnName}
Type: ${relationshipData.cardinality || 'unknown'}\n`
}

// Convert table groups to text document
const tableGroupsToText = (
  tableGroups: Schema['tableGroups'] | undefined,
): string => {
  if (!tableGroups) return ''

  let tableGroupsText = ''

  for (const [groupId, groupData] of Object.entries(tableGroups)) {
    tableGroupsText += `Group ID: ${groupId}\n`

    if (groupData.name) {
      tableGroupsText += `Name: ${String(groupData.name)}\n`
    }

    if (groupData.tables && Array.isArray(groupData.tables)) {
      tableGroupsText += `Tables: ${groupData.tables.join(', ')}\n`
    }

    tableGroupsText += '\n'
  }

  return tableGroupsText
}

// Convert schema data to text format
const convertSchemaToText = (schema: Schema): string => {
  let schemaText = 'FULL DATABASE SCHEMA:\n\n'

  // Process tables
  if (schema.tables) {
    schemaText += 'TABLES:\n\n'
    for (const [tableName, tableData] of Object.entries(schema.tables)) {
      const tableDoc = tableToDocument(tableName, tableData)
      schemaText = `${schemaText}${tableDoc}\n\n`
    }
  }

  // Process relationships
  if (schema.relationships) {
    schemaText += 'RELATIONSHIPS:\n\n'
    for (const [relationshipName, relationshipData] of Object.entries(
      schema.relationships,
    )) {
      const relationshipDoc = relationshipToDocument(
        relationshipName,
        relationshipData,
      )
      schemaText = `${schemaText}${relationshipDoc}\n\n`
    }
  }

  // Process table groups
  if (schema.tableGroups && Object.keys(schema.tableGroups).length > 0) {
    schemaText += 'TABLE GROUPS:\n\n'
    const tableGroupsText = tableGroupsToText(schema.tableGroups)
    schemaText = `${schemaText}${tableGroupsText}\n`
  }

  return schemaText
}

export async function POST(request: Request) {
  const { message, schemaData, history } = await request.json()

  if (!message || typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  if (!schemaData || typeof schemaData !== 'object') {
    return NextResponse.json(
      { error: 'Valid schema data is required' },
      { status: 400 },
    )
  }

  // Format chat history for prompt
  const formattedChatHistory =
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    history && history.length > 0
      ? history
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          .map((msg: [string, string]) => `${msg[0]}: ${msg[1]}`)
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          .join('\n')
      : 'No previous conversation.'

  // Convert schema to text
  const schemaText = convertSchemaToText(schemaData)

  // Determine which agent to use based on the question type
  const questionType = classifyQuestion(message)
  const agentName =
    questionType === 'build'
      ? 'databaseSchemaBuildAgent'
      : 'databaseSchemaAskAgent'
  try {
    // Get the agent from Mastra
    const agent = mastra.getAgent(agentName)
    if (!agent) {
      throw new Error(`${agentName} not found in Mastra instance`)
    }

    // Create a response using the agent
    const response = await agent.generate([
      {
        role: 'system',
        content: `
Complete Schema Information:
${schemaText}

Previous conversation:
${formattedChatHistory}
`,
      },
      {
        role: 'user',
        content: message,
      },
    ])

    return new Response(response.text, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 },
    )
  }
}
