import { createClient as _createClient } from '@liam-hq/db'
import * as Sentry from '@sentry/node'

type SupabaseClient = ReturnType<typeof _createClient>
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




export function createClient(): SupabaseClient {
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
  const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY']

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  const client = _createClient(supabaseUrl, supabaseKey)
  return withSentryErrorReporting(client)
}
