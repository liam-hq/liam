import crypto from 'node:crypto'
import { openai } from '@ai-sdk/openai'
import { MDocument } from '@mastra/rag'
import { embed, embedMany } from 'ai'
import { ensureVectorIndex, queryVectors, storeVectors } from './vectorStore'

const SCHEMA_INDEX_NAME = 'schema_embeddings'
const EMBEDDING_DIMENSION = 1536 // Dimension for text-embedding-3-small
const EMBEDDING_MODEL = 'text-embedding-3-small'

/**
 * Generates a stable ID for a chunk based on its content
 *
 * @param text The text content of the chunk
 * @returns A stable ID as an MD5 hash of the text
 */
function generateStableId(text: string): string {
  return crypto.createHash('md5').update(text).digest('hex')
}

/**
 * Processes schema data and stores it in the vector database
 *
 * @param schemaText The schema text to process and store
 * @returns A promise that resolves when the schema is processed and stored
 */
export async function processAndStoreSchema(schemaText: string): Promise<void> {
  try {
    // Create a document from the schema text
    const doc = MDocument.fromText(schemaText)

    // Chunk the document into smaller pieces for better retrieval
    const chunks = await doc.chunk({
      strategy: 'recursive',
      size: 512,
      overlap: 50,
    })

    // Generate embeddings for each chunk
    const { embeddings } = await embedMany({
      model: openai.embedding(EMBEDDING_MODEL),
      values: chunks.map((chunk) => chunk.text),
    })

    // Create index if it doesn't exist
    await ensureVectorIndex(SCHEMA_INDEX_NAME, EMBEDDING_DIMENSION)

    // Generate stable IDs based on chunk content
    const stableIds = chunks.map((chunk) => generateStableId(chunk.text))

    // Store embeddings in the vector database with stable IDs
    await storeVectors(
      SCHEMA_INDEX_NAME,
      embeddings,
      chunks.map((chunk) => ({
        text: chunk.text,
        source: 'schema',
      })),
      stableIds, // Provide stable IDs to prevent duplicate records
    )
  } catch (error) {
    console.error('Error processing and storing schema:', error)
    throw error
  }
}

/**
 * Queries the vector database for relevant schema information
 *
 * @param query The query to search for
 * @returns The search results
 */
export async function querySchemaVectorStore(
  query: string,
): Promise<
  Array<{ id: string; score: number; metadata?: Record<string, unknown> }>
> {
  try {
    // Generate embedding for the query
    const { embedding } = await embed({
      model: openai.embedding(EMBEDDING_MODEL),
      value: query,
    })

    // Query the vector database
    return queryVectors(SCHEMA_INDEX_NAME, embedding, 5)
  } catch (error) {
    console.error('Error querying schema vector store:', error)
    throw error
  }
}
