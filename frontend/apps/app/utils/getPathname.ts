import { headers } from 'next/headers'

/**
 * Get the current pathname from request headers in a server component
 * This function uses the x-pathname header set by middleware
 */
export function getPathname(): string {
  try {
    const pathname = headers().get('x-pathname')
    return pathname || '/'
  } catch (error) {
    console.error('Error getting pathname from headers:', error)
    return '/'
  }
}
