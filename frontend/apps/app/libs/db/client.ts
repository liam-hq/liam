import { createBrowserClient } from '@liam-hq/db'

export function createClient() {
  return createBrowserClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '',
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '',
  )
}
