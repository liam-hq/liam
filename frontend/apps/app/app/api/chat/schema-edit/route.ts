import { openai } from '@ai-sdk/openai'
import type { Schema } from '@liam-hq/db-structure'
import { type Message, streamText } from 'ai'
import { NextResponse } from 'next/server'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

// Convert schema data to text format
const convertSchemaToText = (schema: Schema): string => {
  let schemaText = 'FULL DATABASE SCHEMA:\n\n'

  // Process tables
  if (schema.tables) {
    schemaText += 'TABLES:\n\n'
    for (const [tableName, tableData] of Object.entries(schema.tables)) {
      schemaText += `Table: ${tableName}\n`
      if (tableData.comment) {
        schemaText += `Description: ${tableData.comment}\n`
      }

      // Columns
      schemaText += 'Columns:\n'
      if (tableData.columns) {
        for (const [columnName, columnData] of Object.entries(
          tableData.columns,
        )) {
          schemaText += `- ${columnName}: ${columnData.type || 'unknown type'} ${columnData.notNull ? '(not nullable)' : '(nullable)'}\n`
          if (columnData.comment) {
            schemaText += `  Description: ${columnData.comment}\n`
          }
          if (columnData.primary) {
            schemaText += '  Primary Key: true\n'
          }
          if (columnData.unique) {
            schemaText += '  Unique: true\n'
          }
        }
      }

      // Indexes
      if (tableData.indexes && Object.keys(tableData.indexes).length > 0) {
        schemaText += 'Indexes:\n'
        for (const [indexName, indexData] of Object.entries(
          tableData.indexes,
        )) {
          schemaText += `- ${indexName}: `
          if (indexData.unique) {
            schemaText += 'UNIQUE '
          }
          schemaText += `on columns (${indexData.columns.join(', ')})\n`
        }
      }

      schemaText += '\n'
    }
  }

  // Process relationships
  if (schema.relationships) {
    schemaText += 'RELATIONSHIPS:\n\n'
    for (const [relationshipName, relationshipData] of Object.entries(
      schema.relationships,
    )) {
      schemaText += `Relationship: ${relationshipName}\n`
      schemaText += `From Table: ${relationshipData.primaryTableName}, Column: ${relationshipData.primaryColumnName}\n`
      schemaText += `To Table: ${relationshipData.foreignTableName}, Column: ${relationshipData.foreignColumnName}\n`
      schemaText += `Cardinality: ${relationshipData.cardinality}\n`
      schemaText += `Update Constraint: ${relationshipData.updateConstraint}\n`
      schemaText += `Delete Constraint: ${relationshipData.deleteConstraint}\n\n`
    }
  }

  // Process table groups
  if (schema.tableGroups && Object.keys(schema.tableGroups).length > 0) {
    schemaText += 'TABLE GROUPS:\n\n'
    for (const [groupId, groupData] of Object.entries(schema.tableGroups)) {
      schemaText += `Group ID: ${groupId}\n`
      schemaText += `Name: ${String(groupData.name)}\n`

      if (groupData.tables && Array.isArray(groupData.tables)) {
        schemaText += `Tables: ${groupData.tables.join(', ')}\n`
      }

      if (groupData.comment) {
        schemaText += `Comment: ${groupData.comment}\n`
      }

      schemaText += '\n'
    }
  }

  return schemaText
}

export async function POST(request: Request) {
  const { messages, schema } = await request.json()

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: 'Messages are required' },
      { status: 400 },
    )
  }

  if (!schema || typeof schema !== 'object') {
    return NextResponse.json(
      { error: 'Valid schema data is required' },
      { status: 400 },
    )
  }

  // Convert schema to text representation
  const schemaText = convertSchemaToText(schema)

  // Create system prompt with schema context
  const systemPrompt = `
You are a database schema expert.
Answer questions about the user's schema and provide advice on database design.
Follow these guidelines:

1. Clearly explain the structure of the schema, tables, and relationships.
2. Provide advice based on good database design principles.
3. Share best practices for normalization, indexing, and performance.
4. When using technical terms, include brief explanations.
5. Provide only information directly related to the question, avoiding unnecessary details.
6. Format your responses using GitHub Flavored Markdown (GFM) for better readability.

Complete Schema Information:
${schemaText}

Your goal is to help users understand and optimize their database schemas.
`

  // Generate streaming response using Vercel AI SDK
  const result = streamText({
    model: openai('gpt-4o'),
    system: systemPrompt,
    messages: messages as Message[],
  })

  // Return streaming response with custom error handling
  return result.toDataStreamResponse({
    // Custom error message handler
    getErrorMessage: (error) => {
      if (error instanceof Error) return error.message
      return 'AIモデルとの通信中にエラーが発生しました。'
    },
    // Send token usage information to the client
    sendUsage: true,
  })
}
