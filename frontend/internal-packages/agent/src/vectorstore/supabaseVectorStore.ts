import crypto from 'node:crypto'
import { SupabaseVectorStore as LangchainSupabaseVectorStore } from '@langchain/community/vectorstores/supabase'
import { Document } from '@langchain/core/documents'
import { OpenAIEmbeddings } from '@langchain/openai'
import { createClient } from '@liam-hq/db'
import type { Schema } from '@liam-hq/db-structure'
import { convertSchemaToText } from '../utils/convertSchemaToText'

/**
 * Generates a hash for the schema data to detect changes
 * @param schema The database schema data
 * @returns A hash string representing the schema content
 */
function generateSchemaHash(schema: Schema): string {
  // Sort keys to ensure consistent ordering regardless of object property order
  const sortedSchema = JSON.stringify(schema, Object.keys(schema).sort())
  return crypto.createHash('sha256').update(sortedSchema).digest('hex')
}

/**
 * Creates documents from schema data using convertSchemaToText
 * @param schema The database schema data
 * @param organizationId Optional organization ID to use for documents
 * @returns An array containing schema content and metadata documents
 */
async function createDocumentFromSchema(
  schema: Schema,
  organizationId?: string,
): Promise<Document[]> {
  // Convert the entire schema to a text document
  const schemaText = convertSchemaToText(schema)

  // Generate schema hash for version tracking
  const schemaHash = generateSchemaHash(schema)
  const timestamp = new Date().toISOString()

  // Create two documents:
  // 1. Schema content document for semantic search
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

  // 2. Schema metadata document for version tracking
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

/**
 * Extended SupabaseVectorStore class that adds updated_at field to documents
 */
class SupabaseVectorStore extends LangchainSupabaseVectorStore {
  /**
   * Override addDocuments method to ensure updated_at is set
   */
  override async addDocuments(documents: Document[]): Promise<string[]> {
    // Add updated_at field to each document if not already present
    // Type assertion is required because LangChain's Document class defines metadata as Record<string, any>,
    // which prevents TypeScript from inferring specific properties like organization_id
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

    // Directly insert documents with updated_at field
    // This bypasses the parent class's addDocuments method which might be causing issues
    const texts = docsWithUpdatedAt.map((doc) => doc.pageContent)
    const metadatas = docsWithUpdatedAt.map((doc) => doc.metadata)

    // Generate embeddings
    const vectors = await this.embeddings.embedDocuments(texts)

    // Insert directly into Supabase
    const client = this.client
    const tableName = this.tableName
    const ids: string[] = []

    // Insert each document one by one to ensure updated_at is set
    for (let i = 0; i < vectors.length; i++) {
      const vector = vectors[i]
      const metadata = metadatas[i]
      const text = texts[i]

      // Ensure updated_at is set
      if (metadata && !metadata.updated_at) {
        metadata.updated_at = new Date().toISOString()
      }

      // Create a typed metadata variable to ensure type safety for database insertion
      // This is necessary because LangChain's Document.metadata is typed as Record<string, any>,
      // which loses specific type information for properties like organization_id and updated_at
      const typedMetadata = metadata as SchemaMetadata

      // Insert into Supabase
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

/**
 * Creates a Supabase Vector Store instance and stores documents with embeddings
 * This function converts schema data to documents, generates embeddings, and stores them in Supabase
 * @param schema The database schema data
 * @param organizationId Optional organization ID to use for documents
 * @returns SupabaseVectorStore instance with documents stored
 */
export async function createSupabaseVectorStore(
  schema: Schema,
  organizationId?: string,
) {
  const openAIApiKey = validateOpenAIKey()

  // Initialize OpenAI embeddings
  const embeddings = new OpenAIEmbeddings({ openAIApiKey })
  const supabaseClient = createSupabaseClient()

  // Convert schema to documents with organization_id if provided
  const docs = await createDocumentFromSchema(schema, organizationId)

  // Process documents in batches
  return await processBatchesAndCreateVectorStore(
    docs,
    embeddings,
    supabaseClient,
  )
}

/**
 * Validates and returns the OpenAI API key
 * @returns The validated OpenAI API key
 * @throws Error if no valid API key is found
 */
function validateOpenAIKey(): string {
  const openAIApiKey = process.env['OPENAI_API_KEY']

  if (!openAIApiKey) {
    throw new Error(
      'Valid OpenAI API key is required for generating embeddings',
    )
  }

  return openAIApiKey
}

/**
 * Creates a Supabase client using environment variables
 * @returns Supabase client instance
 */
function createSupabaseClient() {
  return createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '',
    process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '',
  )
}

/**
 * Process documents in batches and create or update vector store
 * @param docs Array of documents to process
 * @param embeddings OpenAI embeddings instance
 * @param supabaseClient Supabase client instance
 * @returns SupabaseVectorStore instance
 */
async function processBatchesAndCreateVectorStore(
  docs: Document[],
  embeddings: OpenAIEmbeddings,
  supabaseClient: ReturnType<typeof createClient>,
) {
  const BATCH_SIZE = 100
  const totalDocs = docs.length
  let vectorStore = null

  // Process documents in batches
  for (let i = 0; i < totalDocs; i += BATCH_SIZE) {
    const end = Math.min(i + BATCH_SIZE, totalDocs)
    const batch = docs.slice(i, end)

    // Process batch and update vector store reference if needed
    vectorStore = await processBatch({
      batch,
      vectorStore,
      embeddings,
      supabaseClient,
      isFirstBatch: i === 0,
    })
  }

  if (!vectorStore) {
    throw new Error('Failed to create vector store with any batch')
  }

  return vectorStore
}

/**
 * Process a single batch of documents
 */
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
  // Process the current batch of documents

  // Create or reuse the vector store instance
  if (isFirstBatch) {
    // Create the vector store instance directly instead of using fromDocuments
    const vectorStore = new SupabaseVectorStore(embeddings, {
      // biome-ignore lint/suspicious/noExplicitAny: Type mismatch between our Supabase client and LangChain's expected client
      client: supabaseClient as any,
      tableName: 'documents',
      queryName: 'match_documents',
    })

    // Manually add documents to ensure updated_at is set
    await vectorStore.addDocuments(batch)

    return vectorStore
  }

  if (vectorStore) {
    // Add subsequent batches to the existing vector store
    await vectorStore.addDocuments(batch)
    return vectorStore
  }

  return vectorStore
}

// Define a type for schema metadata
interface SchemaMetadata {
  source: string
  type: string
  schemaHash: string
  timestamp: string
  organization_id?: string
  updated_at: string
  [key: string]: unknown
}

/**
 * Gets the stored schema hash from the vector store
 * @returns The stored schema hash or null if not found
 */
async function getStoredSchemaHash(): Promise<string | null> {
  // Create Supabase client directly for more reliable querying
  const supabaseClient = createSupabaseClient()

  // Query for schema_metadata documents directly using metadata
  const { data: metadataDocs, error: metadataError } = await supabaseClient
    .from('documents')
    .select('metadata')
    .eq('metadata->>source', 'schema_metadata')
    .eq('metadata->>type', 'metadata')
    .order('created_at', { ascending: false })
    .limit(1)

  if (metadataError) {
    process.stderr.write(
      `Error querying metadata documents: ${metadataError}\n`,
    )
    return null
  }

  // Log query results for debugging
  process.stdout.write(
    `Found ${metadataDocs?.length || 0} metadata documents\n`,
  )

  // Check if we found a metadata document with a hash
  if (metadataDocs && metadataDocs.length > 0) {
    // Type assertion for metadata
    const metadata = metadataDocs[0]?.metadata as SchemaMetadata
    if (metadata?.schemaHash) {
      const hash = metadata.schemaHash
      process.stdout.write(`Found stored hash in metadata document: ${hash}\n`)
      return hash
    }
  }

  // If no metadata document found, try content documents as fallback
  const { data: contentDocs, error: contentError } = await supabaseClient
    .from('documents')
    .select('metadata')
    .eq('metadata->>source', 'schema')
    .eq('metadata->>type', 'content')
    .order('created_at', { ascending: false })
    .limit(1)

  if (contentError) {
    process.stderr.write(`Error querying content documents: ${contentError}\n`)
    return null
  }

  process.stdout.write(`Found ${contentDocs?.length || 0} content documents\n`)

  // Check if we found a content document with a hash
  if (contentDocs && contentDocs.length > 0) {
    // Type assertion for metadata
    const metadata = contentDocs[0]?.metadata as SchemaMetadata
    if (metadata?.schemaHash) {
      const hash = metadata.schemaHash
      process.stdout.write(`Found stored hash in content document: ${hash}\n`)
      return hash
    }
  }

  process.stdout.write('No stored schema hash found\n')
  return null
}

/**
 * Checks if the schema has been updated by comparing hashes
 * @param schema Current schema data
 * @returns True if schema has been updated or doesn't exist, false otherwise
 */
export async function isSchemaUpdated(schema: Schema): Promise<boolean> {
  // Calculate hash for current schema
  const currentHash = generateSchemaHash(schema)

  // Get stored hash
  const storedHash = await getStoredSchemaHash()

  // If no stored hash exists, consider it as updated
  if (!storedHash) {
    return true
  }

  // Compare hashes
  return currentHash !== storedHash
}
