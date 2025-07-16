import type { SupabaseClientType } from '@liam-hq/db'
import { InMemorySchemaRepository } from './inMemory.ts'
import { SupabaseSchemaRepository } from './supabase.ts'
import type { Repositories } from './types.ts'

/**
 * Factory function to create Supabase-based repositories
 */
export function createSupabaseRepositories(
  client: SupabaseClientType,
): Repositories {
  return {
    schema: new SupabaseSchemaRepository(client),
  }
}

/**
 * Factory function to create in-memory repositories for testing/offline use
 */
export function createInMemoryRepositories(): Repositories {
  return {
    schema: new InMemorySchemaRepository(),
  }
}
