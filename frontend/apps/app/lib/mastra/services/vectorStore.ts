import { PgVector } from '@mastra/pg'

// Initialize PgVector with connection string
const pgVector = new PgVector({
  connectionString: process.env.POSTGRES_URL || '',
})

/**
 * Creates the vector index if it doesn't exist
 */
export async function ensureVectorIndex(
  indexName: string,
  dimension: number,
): Promise<void> {
  await pgVector.createIndex({
    indexName,
    dimension,
  })
}

/**
 * Stores vectors in the database
 */
export async function storeVectors(
  indexName: string,
  vectors: number[][],
  metadata: Record<string, unknown>[],
  ids?: string[],
): Promise<void> {
  await pgVector.upsert({
    indexName,
    vectors,
    metadata,
    ids,
  })
}

/**
 * Queries the vector database
 */
export async function queryVectors(
  indexName: string,
  queryVector: number[],
  topK: number,
): Promise<
  Array<{ id: string; score: number; metadata?: Record<string, unknown> }>
> {
  const results = await pgVector.query({
    indexName,
    queryVector,
    topK,
  })

  return results
}
