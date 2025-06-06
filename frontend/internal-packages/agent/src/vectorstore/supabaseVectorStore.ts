import crypto from 'node:crypto'
import { convertSchemaToText } from './convertSchemaToText'
import { SupabaseVectorStore as LangchainSupabaseVectorStore } from '@langchain/community/vectorstores/supabase'
import { Document } from '@langchain/core/documents'
import { OpenAIEmbeddings } from '@langchain/openai'
import { createClient } from '@liam-hq/db'
import type { Schema } from '@liam-hq/db-structure'

function generateSchemaHash(schema: Schema): string {
  const sortedSchema = JSON.stringify(schema, Object.keys(schema).sort())
  return crypto.createHash('sha256').update(sortedSchema).digest('hex')
}

async function createDocumentFromSchema(
  schema: Schema,
  organizationId?: string,
): Promise<Document[]> {
  const schemaText = convertSchemaToText(schema)

  const schemaHash = generateSchemaHash(schema)
  const timestamp = new Date().toISOString()

  const contentDoc = new Document({
    pageContent: schemaText,
    metadata: {
      source: 'schema',
      type: 'content',
      schemaHash,
      timestamp,
      organization_id: organizationId,
      updated_at: new Date().toISOString(),
    },
  })

  const metadataDoc = new Document({
    pageContent:
      'Schema metadata document. This document contains metadata about the schema version.',
    metadata: {
      source: 'schema_metadata',
      type: 'metadata',
      schemaHash,
      timestamp,
      organization_id: organizationId,
      updated_at: new Date().toISOString(),
    },
  })

  return [contentDoc, metadataDoc]
}

class SupabaseVectorStore extends LangchainSupabaseVectorStore {
  async addDocuments(documents: Document[]): Promise<string[]> {
    const docsWithUpdatedAt = documents.map((doc) => {
      const now = new Date().toISOString()
      return {
        ...doc,
        metadata: {
          ...(doc.metadata as SchemaMetadata),
          updated_at: now,
        } as SchemaMetadata,
      }
    })

    const texts = docsWithUpdatedAt.map((doc) => doc.pageContent)
    const metadatas = docsWithUpdatedAt.map((doc) => doc.metadata)

    const vectors = await this.embeddings.embedDocuments(texts)

    const client = this.client
    const tableName = this.tableName
    const ids: string[] = []

    for (let i = 0; i < vectors.length; i++) {
      const vector = vectors[i]
      const metadata = metadatas[i]
      const text = texts[i]

      if (!metadata.updated_at) {
        metadata.updated_at = new Date().toISOString()
      }

      const typedMetadata = metadata as SchemaMetadata

      const { data, error } = await client
        .from(tableName)
        .insert({
          content: text,
          metadata,
          embedding: vector,
          updated_at: typedMetadata.updated_at,
          organization_id: typedMetadata.organization_id,
        })
        .select('id')

      if (error) {
        throw new Error(
          `Error inserting: ${error.message} ${error.code} ${error.details}`,
        )
      }

      if (data?.[0]?.id) {
        ids.push(data[0].id)
      }
    }

    return ids
  }
}

export async function createSupabaseVectorStore(
  schema: Schema,
  organizationId?: string,
) {
  try {
    const openAIApiKey = validateOpenAIKey()

    const embeddings = new OpenAIEmbeddings({ openAIApiKey })
    const supabaseClient = createSupabaseClient()

    const docs = await createDocumentFromSchema(schema, organizationId)

    return await processBatchesAndCreateVectorStore(
      docs,
      embeddings,
      supabaseClient,
    )
  } catch (error) {
    process.stderr.write(`Error in implementation: ${error}\n`)
    throw error
  }
}

function validateOpenAIKey(): string {
  const openAIApiKey = process.env.OPENAI_API_KEY

  if (!openAIApiKey) {
    throw new Error(
      'Valid OpenAI API key is required for generating embeddings',
    )
  }

  return openAIApiKey
}

function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  )
}

async function processBatchesAndCreateVectorStore(
  docs: Document[],
  embeddings: OpenAIEmbeddings,
  supabaseClient: ReturnType<typeof createClient>,
) {
  const BATCH_SIZE = 100
  const totalDocs = docs.length
  let vectorStore = null

  for (let i = 0; i < totalDocs; i += BATCH_SIZE) {
    const end = Math.min(i + BATCH_SIZE, totalDocs)
    const batch = docs.slice(i, end)
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1

    try {
      vectorStore = await processBatch({
        batch,
        vectorStore,
        embeddings,
        supabaseClient,
        isFirstBatch: i === 0,
      })
    } catch (batchError) {
      logBatchError(batchError, batchNumber)
    }
  }

  if (!vectorStore) {
    throw new Error('Failed to create vector store with any batch')
  }

  return vectorStore
}

async function processBatch({
  batch,
  vectorStore,
  embeddings,
  supabaseClient,
  isFirstBatch,
}: {
  batch: Document[]
  vectorStore: SupabaseVectorStore | null
  embeddings: OpenAIEmbeddings
  supabaseClient: ReturnType<typeof createClient>
  isFirstBatch: boolean
}) {
  if (isFirstBatch) {
    try {
      const vectorStore = new SupabaseVectorStore(embeddings, {
        client: supabaseClient as any,
        tableName: 'documents',
        queryName: 'match_documents',
      })

      await vectorStore.addDocuments(batch)

      return vectorStore
    } catch (error) {
      process.stderr.write(`Error creating vector store: ${error}\n`)
      throw error
    }
  }

  if (vectorStore) {
    await vectorStore.addDocuments(batch)
    return vectorStore
  }

  return vectorStore
}

function logBatchError(batchError: unknown, batchNumber: number) {
  process.stderr.write(`Error processing batch ${batchNumber}: ${batchError}\n`)

  if (batchError instanceof Error) {
    process.stderr.write(`Error details: ${batchError.message}\n`)
    if (batchError.stack) {
      process.stderr.write(`Stack trace: ${batchError.stack}\n`)
    }
  }
}

interface SchemaMetadata {
  source: string
  type: string
  schemaHash: string
  timestamp: string
  organization_id?: string
  updated_at: string
  [key: string]: unknown
}

async function getStoredSchemaHash(): Promise<string | null> {
  try {
    const supabaseClient = createSupabaseClient()

    const { data: metadataDocs } = await supabaseClient
      .from('documents')
      .select('metadata')
      .eq('metadata->>source', 'schema_metadata')
      .eq('metadata->>type', 'metadata')
      .order('created_at', { ascending: false })
      .limit(1)

    process.stdout.write(
      `Found ${metadataDocs?.length || 0} metadata documents\n`,
    )

    if (metadataDocs && metadataDocs.length > 0) {
      const metadata = metadataDocs[0].metadata as SchemaMetadata
      if (metadata?.schemaHash) {
        const hash = metadata.schemaHash
        process.stdout.write(
          `Found stored hash in metadata document: ${hash}\n`,
        )
        return hash
      }
    }

    const { data: contentDocs } = await supabaseClient
      .from('documents')
      .select('metadata')
      .eq('metadata->>source', 'schema')
      .eq('metadata->>type', 'content')
      .order('created_at', { ascending: false })
      .limit(1)

    process.stdout.write(
      `Found ${contentDocs?.length || 0} content documents\n`,
    )

    if (contentDocs && contentDocs.length > 0) {
      const metadata = contentDocs[0].metadata as SchemaMetadata
      if (metadata?.schemaHash) {
        const hash = metadata.schemaHash
        process.stdout.write(`Found stored hash in content document: ${hash}\n`)
        return hash
      }
    }

    process.stdout.write('No stored schema hash found\n')
    return null
  } catch (error) {
    process.stderr.write(`Error getting stored schema hash: ${error}\n`)
    return null
  }
}

export async function isSchemaUpdated(schema: Schema): Promise<boolean> {
  try {
    const currentHash = generateSchemaHash(schema)

    const storedHash = await getStoredSchemaHash()

    if (!storedHash) {
      return true
    }

    return currentHash !== storedHash
  } catch (error) {
    process.stderr.write(`Error checking if schema is updated: ${error}\n`)
    return true
  }
}
