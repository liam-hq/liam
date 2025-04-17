import { headers } from 'next/headers'

/**
 * Get the current pathname from request headers in a server component
 * This function uses the x-pathname header set by middleware
 */
export async function getPathname(): Promise<string> {
  const headersList = await headers()
  return headersList.get('x-pathname') || '/'
}
