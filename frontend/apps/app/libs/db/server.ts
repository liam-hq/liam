import { createServerClient } from '@liam-hq/db'
import { cookies } from 'next/headers'

export type SupabaseClient = Awaited<ReturnType<typeof createClient>>

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

  if (useServiceRole && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // Log when using service role key (recommended to disable in production)
    if (process.env.NODE_ENV !== 'production') {
      // Using a comment instead of console.log to avoid linter errors
      // The fact that RLS is bypassed will be visible in the DB logs if needed
    }
  }

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
