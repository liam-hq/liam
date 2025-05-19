import { PgVector } from '@mastra/pg'

// Use lazy initialization
let pgVectorInstance: PgVector | null = null

function getPgVector(): PgVector {
  if (!pgVectorInstance) {
    pgVectorInstance = new PgVector({
      connectionString:
        process.env.POSTGRES_URL_NON_POOLING ||
        'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
      pgPoolOptions: {
        ssl: {
          rejectUnauthorized: true,
          ca: process.env.PG_SSL_CA,
        },
      },
    })
  }
  return pgVectorInstance
}

/**
 * Creates the vector index if it doesn't exist
 */
export async function ensureVectorIndex(
  indexName: string,
  dimension: number,
): Promise<void> {
  await getPgVector().createIndex({
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
  await getPgVector().upsert({
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
  const results = await getPgVector().query({
    indexName,
    queryVector,
    topK,
  })

  return results
}
