import { createClient as _createClient } from '@liam-hq/db'

export type SupabaseClient = ReturnType<typeof _createClient>

export function createClient(): SupabaseClient {
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
  const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY']

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return _createClient(supabaseUrl, supabaseKey)
}
