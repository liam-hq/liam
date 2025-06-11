import type { Schema } from '@liam-hq/db-structure'
import {
  createSupabaseVectorStore,
  isSchemaUpdated,
} from './supabaseVectorStore'

/**
 * Validates required environment variables
 * @returns True if all required environment variables are set
 */
function validateEnvironmentVariables(): boolean {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY',
  ]

  const missingVars = requiredVars.filter((varName) => !process.env[varName])

  if (missingVars.length > 0) {
    process.stderr.write(
      'Error: The following required environment variables are missing:\n',
    )
    for (const varName of missingVars) {
      process.stderr.write(`  - ${varName}\n`)
    }
    process.stderr.write(
      '\nPlease set these variables in your .env.local file.\n',
    )
    return false
  }

  return true
}

/**
 * Synchronizes schema data with vector store
 * Can be called directly from API routes
 * @param schemaData The schema data to synchronize
 * @param organizationId Organization ID for vector store
 * @param forceUpdate Force update even if schema hasn't changed
 * @returns True if synchronization was performed, false otherwise
 */
export async function syncSchemaVectorStore(
  schemaData: Schema,
  organizationId: string,
  forceUpdate = false,
): Promise<boolean> {
  // Validate environment variables
  if (!validateEnvironmentVariables()) {
    throw new Error('Required environment variables are missing')
  }

  // Check if schema has been updated
  const needsUpdate = forceUpdate || (await isSchemaUpdated(schemaData))

  if (needsUpdate) {
    // Initialize or update vector store
    await createSupabaseVectorStore(schemaData, organizationId)
    return true
  }

  return false
}
