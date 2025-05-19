import { PgVector } from '@mastra/pg'

// Use lazy initialization
let pgVectorInstance: PgVector | null = null

function getPostgresConnectionString(): string {
  const {
    POSTGRES_USER,
    POSTGRES_PASSWORD,
    POSTGRES_HOST,
    POSTGRES_PORT = '5432',
    POSTGRES_DATABASE,
    POSTGRES_SSLMODE,
  } = process.env

  if (
    !POSTGRES_USER ||
    !POSTGRES_PASSWORD ||
    !POSTGRES_HOST ||
    !POSTGRES_DATABASE
  ) {
    throw new Error('Missing required PostgreSQL environment variables')
  }

  return `postgresql://${encodeURIComponent(POSTGRES_USER)}:${encodeURIComponent(POSTGRES_PASSWORD)}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DATABASE}?sslmode=${POSTGRES_SSLMODE}`
}

function getPgVector(): PgVector {
  if (!pgVectorInstance) {
    const connectionString = getPostgresConnectionString()
    pgVectorInstance = new PgVector({
      connectionString,
      pgPoolOptions: {
        ssl: {
          rejectUnauthorized: process.env.POSTGRES_SSLMODE !== 'disable',
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
