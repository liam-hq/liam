import { formatGitHubReference } from '@/lib/github/urlGenerator'
import { langfuseHandler } from '@/lib/langfuse/langfuseHandler'
import { retrieveRelevantDocuments } from '@/lib/vectorstore/supabaseRetriever'
import {} from '@langchain/core/messages'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { ChatOpenAI } from '@langchain/openai'
import { Document } from 'langchain/document'
import { formatDocumentsAsString } from 'langchain/util/document'
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
const tableToDocument = (tableName: string, tableData: TableData): Document => {
  // Table description
  const tableDescription = `Table: ${tableName}\nDescription: ${tableData.description || 'No description'}\n`

  // Columns information
  let columnsText = 'Columns:\n'
  if (tableData.columns) {
    for (const [columnName, columnData] of Object.entries(tableData.columns)) {
      columnsText += `- ${columnName}: ${columnData.type || 'unknown type'} ${columnData.nullable ? '(nullable)' : '(not nullable)'}\n`
      if (columnData.description) {
        columnsText += `  Description: ${columnData.description}\n`
      }
    }
  }

  // Primary key information
  let primaryKeyText = ''
  if (tableData.primaryKey?.columns) {
    primaryKeyText = `Primary Key: ${tableData.primaryKey.columns.join(', ')}\n`
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
  relationshipData: RelationshipData,
): Document => {
  const relationshipText = `Relationship: ${relationshipName}
From Table: ${relationshipData.fromTable}
From Column: ${relationshipData.fromColumn}
To Table: ${relationshipData.toTable}
To Column: ${relationshipData.toColumn}
Type: ${relationshipData.type || 'unknown'}\n`

  return new Document({
    pageContent: relationshipText,
    metadata: { relationshipName },
  })
}

// Convert table groups to text document
const tableGroupsToText = (
  tableGroups: Record<string, TableGroupData> | undefined,
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
const convertSchemaToText = (schema: SchemaData): string => {
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

  // Initialize relevant docs text and references
  let relevantDocsText = ''
  let relevantDocsReferences: {
    source: string
    page: number | null
    line?: number
    githubUrl?: string
  }[] = []

  try {
    // Retrieve relevant documents from vector store
    const relevantDocs = await retrieveRelevantDocuments(message, 3)

    // Extract references from document metadata and generate GitHub links
    relevantDocsReferences = relevantDocs.map((doc) => {
      const source = doc.metadata.source || 'Unknown source'
      const page = doc.metadata.page || null
      const line = doc.metadata.loc?.lines?.from || undefined

      // Generate GitHub reference link if source is available
      const githubRef =
        source !== 'Unknown source'
          ? formatGitHubReference(source, line)
          : undefined

      return {
        source,
        page,
        line,
        githubUrl: githubRef,
      }
    })

    // Format the retrieved documents as a string
    relevantDocsText = formatDocumentsAsString(relevantDocs)

    // Log success
    process.stdout.write(
      `Retrieved ${relevantDocs.length} relevant documents for query: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"\n`,
    )
  } catch (error) {
    // Log the error but continue without vector store results
    process.stderr.write(
      `Error retrieving documents from vector store: ${error}\n`,
    )
    process.stdout.write('Continuing without vector store results\n')
  }

  // Create a streaming model
  const streamingModel = new ChatOpenAI({
    modelName: 'o4-mini-2025-04-16',
    streaming: true,
    callbacks: [langfuseHandler],
  })

  // Create a prompt template with schema context, relevant docs, and chat history
  const prompt = ChatPromptTemplate.fromTemplate(`
You are a database schema expert.
Answer questions about the user's schema and provide advice on database design.
Follow these guidelines:

1. Clearly explain the structure of the schema, tables, and relationships.
2. Provide advice based on good database design principles.
3. Share best practices for normalization, indexing, and performance.
4. When using technical terms, include brief explanations.
5. Provide only information directly related to the question, avoiding unnecessary details.
6. Format your responses using GitHub Flavored Markdown (GFM) for better readability.
7. ONLY reference documentation that is provided to you in the "Relevant Database Best Practices and Documentation" section below.
8. DO NOT include links to external websites like postgresql.org or other documentation sites.
9. If your answer is based on specific documentation, include references at the end of your response with GitHub links in this format: "References: [document name](github_url)" (e.g., "References: [Naming Conventions](https://github.com/liam-hq/liam/blob/main/docs/best_practices/naming.md?plain=1#L12)").

Your goal is to help users understand and optimize their database schemas.

Complete Schema Information:
${schemaText}

Relevant Database Best Practices and Documentation:
${relevantDocsText}

Document References:
${relevantDocsReferences
  .map(
    (ref) =>
      `- Source: ${ref.source}${ref.line ? `, Line: ${ref.line}` : ''}${ref.githubUrl ? `, URL: ${ref.githubUrl}` : ''}`,
  )
  .join('\n')}

Previous conversation:
{chat_history}

Question: {input}

Based on the schema information provided, relevant documentation, and considering any previous conversation, answer the question thoroughly and accurately. If you reference specific documentation, be sure to include the references at the end of your response as clickable GitHub links. NEVER include links to external websites.
`)

  // Create streaming chain
  const streamingChain = prompt.pipe(streamingModel)

  // Generate streaming response
  const stream = await streamingChain.stream(
    {
      input: message,
      chat_history: formattedChatHistory,
      references: relevantDocsReferences,
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
      process.stderr.write(`Error processing stream: ${error}\n`)
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
