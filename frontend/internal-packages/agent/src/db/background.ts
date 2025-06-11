import { createServerClient } from '@liam-hq/db'

/**
 * Create a Supabase client for background jobs (without cookies)
 * This client uses the service role key to bypass RLS and doesn't require cookies
 */
export function createBackgroundClient() {
  const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY']

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for background jobs')
  }

  return createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '',
    serviceRoleKey,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // No-op for background jobs
        },
      },
    },
  )
}
