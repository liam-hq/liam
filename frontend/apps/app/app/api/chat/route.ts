import { langfuseHandler } from '@/lib/langfuse/langfuseHandler'
import {} from '@langchain/core/messages'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { ChatOpenAI } from '@langchain/openai'
import {
  type Relationship,
  type Schema,
  type Table,
  type TableGroup,
  schemaSchema,
} from '@liam-hq/db-structure'
import { Document } from 'langchain/document'
import { NextResponse } from 'next/server'

// Define types for schema data
export interface ColumnData {
  type?: string
  nullable?: boolean
  description?: string
}

export interface TableData {
  description?: string
  columns?: Record<string, ColumnData>
  primaryKey?: {
    columns?: string[]
  }
}

export interface RelationshipData {
  fromTable: string
  fromColumn: string
  toTable: string
  toColumn: string
  type?: string
}

export interface TableGroupData {
  name?: string
  tables?: string[]
  comment?: string | null
}

export interface SchemaData {
  tables?: Record<string, TableData>
  relationships?: Record<string, RelationshipData>
  tableGroups?: Record<string, TableGroupData>
}

// Convert table data to text document
const tableToDocument = (tableName: string, tableData: Table): Document => {
  // Table description
  const tableDescription = `Table: ${tableName}\nDescription: ${tableData.comment || 'No description'}\n`

  // Columns information
  let columnsText = 'Columns:\n'
  if (tableData.columns) {
    for (const [columnName, columnData] of Object.entries(tableData.columns)) {
      columnsText += `- ${columnName}: ${columnData.type || 'unknown type'} ${columnData.notNull ? '(not nullable)' : '(nullable)'}\n`
      if (columnData.comment) {
        columnsText += `  Description: ${columnData.comment}\n`
      }
    }
  }

  // Primary key information
  let primaryKeyText = ''
  // Find primary key constraints
  if (tableData.constraints) {
    const primaryKeyConstraints = Object.values(tableData.constraints).filter(
      (constraint) => constraint.type === 'PRIMARY KEY',
    )

    if (primaryKeyConstraints.length > 0) {
      const primaryKeyColumns = primaryKeyConstraints.map(
        (constraint) => constraint.columnName,
      )
      primaryKeyText = `Primary Key: ${primaryKeyColumns.join(', ')}\n`
    }
  }

  // Combine all information
  const tableText = `${tableDescription}${columnsText}${primaryKeyText}`

  return new Document({
    pageContent: tableText,
    metadata: { tableName },
  })
}

// Convert relationship data to text document
const relationshipToDocument = (
  relationshipName: string,
  relationshipData: Relationship,
): Document => {
  const relationshipText = `Relationship: ${relationshipName}
From Table: ${relationshipData.primaryTableName}
From Column: ${relationshipData.primaryColumnName}
To Table: ${relationshipData.foreignTableName}
To Column: ${relationshipData.foreignColumnName}
Type: ${relationshipData.cardinality || 'unknown'}\n`

  return new Document({
    pageContent: relationshipText,
    metadata: { relationshipName },
  })
}

// Convert table groups to text document
const tableGroupsToText = (
  tableGroups: Record<string, TableGroup> | undefined,
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
      schemaText = `${schemaText}${tableDoc.pageContent}\n\n`
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
      schemaText = `${schemaText}${relationshipDoc.pageContent}\n\n`
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

  // Format chat history for prompt template
  const formattedChatHistory =
    history && history.length > 0
      ? history
          .map((msg: [string, string]) => `${msg[0]}: ${msg[1]}`)
          .join('\n')
      : 'No previous conversation.'

  // Convert schema to text
  const schemaText = convertSchemaToText(schemaData)

  // Create a streaming model
  const streamingModel = new ChatOpenAI({
    modelName: 'o4-mini-2025-04-16',
    streaming: true,
    callbacks: [langfuseHandler],
  })

  // Create a prompt template with full schema context and chat history
  const prompt = ChatPromptTemplate.fromTemplate(`
You are a database-schema expert.  

Your mission is to help users understand and optimize their database schemas with strong attention to performance, security, and scalability.

== Answer Guidelines ==
1. **Always start with an ERD diagram.**  
   • Convert the user’s Valibot **schema_schema** into a plain JSON object that strictly adheres to the same structure (tables, columns, relationships, etc.).  
   • Wrap that JSON object inside a code fence like this so the chat UI can render it visually:  
     \`\`\`erd
     // JSON that conforms to schema_schema
     \`\`\`  
2. After the ERD block, clearly explain the schema structure.  
3. Provide recommendations grounded in solid database-design principles (normalization, indexing, partitioning, security hardening, etc.).  
4. Explicitly highlight performance, security, and scalability considerations.  
5. When using technical terms, add a brief Japanese gloss in parentheses.  
6. Stay on topic; avoid unrelated details.  
7. Format the entire response using GitHub Flavored Markdown (GFM).

== Input Variables ==

• **{schema_schema}** – Valibot type-schema definition.  
• Complete Schema Information: ${schemaText}  
• Previous conversation: {chat_history}  
• User question: {input}

== Output Template ==

If in *Clarification Phase* → output only the lines starting with **“Q:”**.  

If in *Answer Phase* → output:

1. The ERD block (mandatory).  
2. Explanations and recommendations following the guidelines.

Your goal is to ensure the user walks away with a secure, high-performance, and future-proof schema.

`)

  // Create streaming chain
  const streamingChain = prompt.pipe(streamingModel)

  // Generate streaming response
  const stream = await streamingChain.stream(
    {
      input: message,
      chat_history: formattedChatHistory,
      schema_schema: schemaSchema,
    },
    {
      callbacks: [langfuseHandler],
      metadata: {
        endpoint: '/api/chat',
        method: 'POST',
        messageLength: message.length,
        hasHistory: history ? history.length > 0 : false,
      },
    },
  )

  // Create a TransformStream to convert the LangChain stream to a ReadableStream
  const encoder = new TextEncoder()
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()

  // Process the LangChain stream
  ;(async () => {
    try {
      for await (const chunk of stream) {
        // Convert complex content to string if needed
        let textContent = ''
        if (typeof chunk.content === 'string') {
          textContent = chunk.content
        } else if (Array.isArray(chunk.content)) {
          // Handle complex content structure
          for (const item of chunk.content) {
            if (typeof item === 'string') {
              textContent += item
            } else if (item.type === 'text') {
              textContent += item.text
            }
          }
        }

        // Write the text content to the stream
        await writer.write(encoder.encode(textContent))
      }
    } catch (error) {
      console.error('Error processing stream:', error)
    } finally {
      await writer.close()
    }
  })()

  // Return the streaming response
  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
