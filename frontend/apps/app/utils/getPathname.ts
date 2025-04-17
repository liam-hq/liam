import { headers } from 'next/headers'

/**
 * Get the current pathname from request headers in a server component
 * This function uses the x-pathname header set by middleware
 */
export function getPathname(): string {
  try {
    const headersList = headers() as unknown as {
      get(name: string): string | null
    }
    return headersList.get('x-pathname') || '/'
  } catch (error) {
    console.error('Error getting pathname from headers:', error)
    return '/'
  }
}
