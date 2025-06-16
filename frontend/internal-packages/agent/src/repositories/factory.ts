import type { SupabaseClientType } from '@liam-hq/db'
import { SupabaseSchemaRepository } from './supabase'
import type { Repositories } from './types'

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
