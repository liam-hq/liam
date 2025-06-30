import type { FormatType } from '../../../../../components/FormatIcon/FormatIcon'

// Parse allowed domains from environment variable
const parseAllowedDomains = (): string[] => {
  const envDomains = process.env.NEXT_PUBLIC_ALLOWED_DOMAINS || ''
  if (!envDomains) {
    // Default allowed domains if env var is not set
    return [
      'raw.githubusercontent.com',
      'github.com',
      'gitlab.com',
    ]
  }
  return envDomains.split(',').map((domain) => domain.trim()).filter(Boolean)
}

export const isValidSchemaUrl = (url: string): boolean => {
  // Check if it's a valid URL
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    return false
  }

  // Sanitize pathname to prevent path traversal
  const pathname = parsedUrl.pathname
  if (pathname.includes('..') || pathname.includes('//')) {
    return false
  }

  // Check for valid schema file extensions
  const validExtensions = ['.sql', '.rb', '.prisma', '.json']
  const hasValidExtension = validExtensions.some((ext) =>
    pathname.toLowerCase().endsWith(ext),
  )

  // Additional security: check for suspicious patterns
  const suspiciousPatterns = [
    /[<>'"]/, // HTML/Script injection characters
    /\0/, // Null bytes
    /%00/, // URL-encoded null bytes
  ]

  if (suspiciousPatterns.some((pattern) => pattern.test(url))) {
    return false
  }

  return hasValidExtension
}

export const getFormatFromUrl = (url: string): FormatType => {
  const extension = url.split('.').pop()?.toLowerCase()

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
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const fileName = pathname.split('/').pop() || 'schema'
    return fileName
  } catch {
    return 'schema'
  }
}

// Enhanced function for fetching schema from URL with security improvements
export const fetchSchemaFromUrl = async (
  url: string,
): Promise<{
  success: boolean
  content?: string
  error?: string
}> => {
  // Step 1: Validate URL format and protocol
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    return {
      success: false,
      error: 'Invalid URL format. Please provide a valid URL.',
    }
  }

  // Step 2: Validate protocol (only allow HTTPS in production)
  const allowedProtocols = ['https:']
  if (!allowedProtocols.includes(parsedUrl.protocol)) {
    return {
      success: false,
      error: `Unsupported protocol: ${parsedUrl.protocol}. Only HTTPS is allowed.`,
    }
  }

  // Step 3: Validate domain whitelist
  const allowedDomains = parseAllowedDomains()

  // For development/demo purposes, allow localhost
  if (process.env.NODE_ENV === 'development') {
    allowedDomains.push('localhost', '127.0.0.1')
  }

  const hostname = parsedUrl.hostname.toLowerCase()
  const isDomainAllowed = allowedDomains.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
  )

  if (!isDomainAllowed && process.env.NODE_ENV !== 'development') {
    return {
      success: false,
      error: `Domain not allowed: ${hostname}. Please use a trusted source.`,
    }
  }

  // Step 4: Validate file extension
  if (!isValidSchemaUrl(url)) {
    return {
      success: false,
      error: 'Invalid file type. Supported formats: .sql, .rb, .prisma, .json',
    }
  }

  // Step 5: Sanitize URL by removing unnecessary parts
  const sanitizedUrl = `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname}`

  try {
    // In production, make a secure API call to fetch the schema
    const response = await fetch(sanitizedUrl, {
      method: 'GET',
      headers: {
        Accept: 'text/plain',
      },
      // Add security headers and timeout as needed
    })

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch schema: HTTP ${response.status}`,
      }
    }

    const content = await response.text()
    return {
      success: true,
      content,
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch schema: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}
