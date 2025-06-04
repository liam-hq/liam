import { createServerClient } from '@liam-hq/db'
import { cookies } from 'next/headers'
import * as Sentry from '@sentry/nextjs'

function withSentryErrorReporting<T extends object>(client: T): T {
  return new Proxy(client, {
    get(target: T, prop: string | symbol) {
      const originalMethod = (target as any)[prop]
      
      if (typeof originalMethod !== 'function') {
        return originalMethod
      }
      
      return function (...args: unknown[]) {
        const result = originalMethod.apply(target, args)
        
        if (result && typeof result === 'object' && 'then' in result && typeof result.then === 'function') {
          return (result as Promise<{ error?: { message: string } }>).then((response) => {
            if (response?.error) {
              Sentry.captureException(new Error(`Supabase error: ${response.error.message}`), {
                extra: {
                  supabaseError: response.error,
                  operation: String(prop),
                  args: args
                }
              })
            }
            return response
          })
        }
        
        if (result && typeof result === 'object' && 'error' in result && (result as { error?: { message: string } }).error) {
          const errorResult = result as { error: { message: string } }
          Sentry.captureException(new Error(`Supabase error: ${errorResult.error.message}`), {
            extra: {
              supabaseError: errorResult.error,
              operation: String(prop),
              args: args
            }
          })
        }
        
        return result
      }
    }
  })
}

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

  const client = createServerClient(
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

  return withSentryErrorReporting(client)
}
