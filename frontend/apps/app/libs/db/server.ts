import { createServerClient } from '@liam-hq/db'
import { err, ok, type Result } from 'neverthrow'
import { cookies } from 'next/headers'

/**
 * Create a Supabase client
 * @param options Options
 * @param options.useServiceRole Whether to use the service role key (true to bypass RLS)
 * @returns Supabase client
 */
export async function createClient({
  useServiceRole = false,
}: {
  useServiceRole?: boolean
} = {}) {
  const cookieStore = await cookies()

  // Use the service role key if specified and available in environment variables
  const apiKey =
    useServiceRole && process.env.SUPABASE_SERVICE_ROLE_KEY
      ? process.env.SUPABASE_SERVICE_ROLE_KEY
      : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '')

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    apiKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        },
      },
    },
  )
}

/**
 * Create a public Supabase client for anonymous access
 * This is foundation code for Public Share feature Phase 1.1
 * Will be used in future phases for server-side anonymous access to public data
 */
export function createPublicServerClient(): Result<
  ReturnType<typeof createServerClient>,
  Error
> {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    return err(new Error('SUPABASE_URL environment variable is not set'))
  }

  if (!supabaseAnonKey) {
    return err(new Error('SUPABASE_ANON_KEY environment variable is not set'))
  }

  return ok(
    createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }),
  )
}
