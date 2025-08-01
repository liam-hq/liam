import type { FormatType } from '../../../../../components/FormatIcon/FormatIcon'

// Convert GitHub URLs to raw content URLs - similar to ERD viewer approach
const resolveContentUrl = (url: string): string | undefined => {
  try {
    const parsedUrl = new URL(url)

    if (parsedUrl.hostname === 'github.com' && url.includes('/blob/')) {
      return url
        .replace('github.com', 'raw.githubusercontent.com')
        .replace('/blob', '')
    }

    return url
  } catch {
    return undefined
  }
}

export const isValidSchemaUrl = (url: string): boolean => {
  // Check if it's a valid URL
  if (typeof URL.canParse === 'function') {
    if (!URL.canParse(url)) {
      return false
    }
  } else {
    try {
      new URL(url)
    } catch {
      return false
    }
  }

  const resolvedUrl = resolveContentUrl(url)
  if (!resolvedUrl) {
    return false
  }

  const parsedUrl = new URL(resolvedUrl)
  const pathname = parsedUrl.pathname

  // Check for valid schema file extensions
  const validExtensions = ['.sql', '.rb', '.prisma', '.json']
  const hasValidExtension = validExtensions.some((ext) =>
    pathname.toLowerCase().endsWith(ext),
  )

  return hasValidExtension
}

export const getFormatFromUrl = (url: string): FormatType => {
  // Parse URL to extract pathname without query params and fragments
  const resolvedUrl = resolveContentUrl(url)
  const pathname =
    resolvedUrl && URL.canParse(resolvedUrl)
      ? new URL(resolvedUrl).pathname
      : (url.split('?')[0]?.split('#')[0] ?? '')

  // Extract extension from pathname
  const extension = pathname?.split('.').pop()?.toLowerCase()

  switch (extension) {
    case 'sql':
      return 'postgres'
    case 'rb':
      return 'schemarb'
    case 'prisma':
      return 'prisma'
    case 'json':
      return 'tbls'
    default:
      return 'postgres' // Default format
  }
}

export const getFileNameFromUrl = (url: string): string => {
  const resolvedUrl = resolveContentUrl(url)
  if (!resolvedUrl || !URL.canParse(resolvedUrl)) {
    return 'schema'
  }
  const urlObj = new URL(resolvedUrl)
  const pathname = urlObj.pathname
  const fileName = pathname.split('/').pop() || 'schema'
  return fileName
}

// Simplified function for fetching schema from URL - similar to ERD viewer approach
export const fetchSchemaFromUrl = async (
  url: string,
): Promise<{
  success: boolean
  content?: string
  error?: string
}> => {
  // Validate and resolve URL
  if (!isValidSchemaUrl(url)) {
    return {
      success: false,
      error: 'Invalid file type. Supported formats: .sql, .rb, .prisma, .json',
    }
  }

  const contentUrl = resolveContentUrl(url)
  if (!contentUrl) {
    return {
      success: false,
      error: 'Invalid URL format. Please provide a valid URL.',
    }
  }

  try {
    const response = await fetch(contentUrl, { cache: 'no-store' })

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch schema: HTTP ${response.status}`,
      }
    }

    const content = await response.text()
    return { success: true, content }
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch schema: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}
