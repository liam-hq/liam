import type { SupabaseClientType } from '@liam-hq/db'
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
