import type { Schema } from '@liam-hq/db-structure'
import {
  createSupabaseVectorStore,
  isSchemaUpdated,
} from './supabaseVectorStore'

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

export async function syncSchemaVectorStore(
  schemaData: Schema,
  organizationId: string,
  forceUpdate = false,
): Promise<boolean> {
  try {
    if (!validateEnvironmentVariables()) {
      throw new Error('Required environment variables are missing')
    }

    const needsUpdate = forceUpdate || (await isSchemaUpdated(schemaData))

    if (needsUpdate) {
      await createSupabaseVectorStore(schemaData, organizationId)
      return true
    }

    return false
  } catch (error) {
    process.stderr.write(`Error synchronizing vector store: ${error}\n`)
    throw error
  }
}
