import type { FormatType } from '../../../../../components/FormatIcon/FormatIcon'

// Parse allowed domains from environment variable
const parseAllowedDomains = (): string[] => {
  const envDomains = process.env.NEXT_PUBLIC_ALLOWED_DOMAINS

  // If env var is not set or is empty string, return no allowed domains for security
  // This prevents accidental exposure when NEXT_PUBLIC_ALLOWED_DOMAINS is not properly configured
  if (!envDomains || envDomains.trim() === '') {
    console.warn(
      'NEXT_PUBLIC_ALLOWED_DOMAINS is not configured. No external domains will be allowed.',
    )
    return []
  }

  return envDomains
    .split(',')
    .map((domain) => domain.trim())
    .filter(Boolean)
}

export const isValidSchemaUrl = (url: string): boolean => {
  // Check if it's a valid URL
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    return false
  }

  // Check domain whitelist with stricter validation
  const allowedDomains = parseAllowedDomains()
  const isAllowedDomain = allowedDomains.some((domain) => {
    // Exact match
    if (parsedUrl.hostname === domain) return true

    // Subdomain match - ensure it's a legitimate subdomain, not a look-alike domain
    if (parsedUrl.hostname.endsWith(`.${domain}`)) {
      // Additional check: ensure it's not a domain like "evil-github.com" when "github.com" is allowed
      const beforeDomain = parsedUrl.hostname.slice(0, -(domain.length + 1))
      // Reject if there's a hyphen right before the allowed domain (potential look-alike)
      if (beforeDomain.endsWith('-')) return false
      return true
    }

    return false
  })

  if (!isAllowedDomain) {
    return false
  }

  // Sanitize pathname to prevent path traversal
  const pathname = parsedUrl.pathname
  if (pathname.includes('..') || pathname.includes('//')) {
    return false
  }

  // Check for valid schema file extensions (check pathname, not full URL to prevent querystring bypass)
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

  if (suspiciousPatterns.some((pattern) => pattern.test(pathname))) {
    return false
  }

  return hasValidExtension
}

export const getFormatFromUrl = (url: string): FormatType => {
  // Parse URL to extract pathname without query params and fragments
  let pathname: string
  try {
    const urlObj = new URL(url)
    pathname = urlObj.pathname
  } catch {
    // Fallback for invalid URLs
    pathname = url.split('?')[0].split('#')[0]
  }

  // Extract extension from pathname
  const extension = pathname.split('.').pop()?.toLowerCase()

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

  // Step 2: Validate protocol
  const hostname = parsedUrl.hostname.toLowerCase()
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'

  // Allow HTTP only for localhost in development
  const allowedProtocols = ['https:']
  if (process.env.NODE_ENV === 'development' && isLocalhost) {
    allowedProtocols.push('http:')
  }

  if (!allowedProtocols.includes(parsedUrl.protocol)) {
    const protocolError =
      process.env.NODE_ENV === 'development' && parsedUrl.protocol === 'http:'
        ? `HTTP is only allowed for localhost in development. Use HTTPS for ${hostname}.`
        : `Unsupported protocol: ${parsedUrl.protocol}. Only HTTPS is allowed.`

    return {
      success: false,
      error: protocolError,
    }
  }

  // Step 3: Validate domain whitelist
  const allowedDomains = parseAllowedDomains()

  // In development, apply special validation for localhost
  if (process.env.NODE_ENV === 'development') {
    if (isLocalhost) {
      // Additional checks for localhost URLs
      // 1. Ensure the port is within expected range (e.g., common dev server ports)
      const port = parsedUrl.port || '80'
      const allowedPorts = [
        '3000',
        '3001',
        '4000',
        '5000',
        '8000',
        '8080',
        '8081',
      ]

      if (!allowedPorts.includes(port) && port !== '80') {
        return {
          success: false,
          error: `Localhost port ${port} is not allowed. Use common development ports.`,
        }
      }

      // 2. Additional path validation for localhost
      const suspiciousLocalPaths = [
        '/admin',
        '/api',
        '/config',
        '/.env',
        '/secret',
      ]
      if (
        suspiciousLocalPaths.some((path) =>
          parsedUrl.pathname.toLowerCase().startsWith(path),
        )
      ) {
        return {
          success: false,
          error: 'Access to sensitive localhost paths is not allowed.',
        }
      }
    }
  }

  // Check if domain is in the allowed list with look-alike protection
  const isDomainAllowed = allowedDomains.some((domain) => {
    if (hostname === domain) return true

    if (hostname.endsWith(`.${domain}`)) {
      const beforeDomain = hostname.slice(0, -(domain.length + 1))
      if (beforeDomain.endsWith('-')) return false // Block evil-github.com
      return true
    }

    return false
  })

  // In development, also allow localhost with the additional checks above
  const isLocalhostAllowed =
    process.env.NODE_ENV === 'development' &&
    (hostname === 'localhost' || hostname === '127.0.0.1')

  if (!isDomainAllowed && !isLocalhostAllowed) {
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
    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 seconds timeout

    // In production, make a secure API call to fetch the schema
    const response = await fetch(sanitizedUrl, {
      method: 'GET',
      headers: {
        Accept: 'text/plain',
        'User-Agent': 'liam-schema-fetcher/1.0',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch schema: HTTP ${response.status}`,
      }
    }

    // Check content length to prevent memory exhaustion
    const contentLength = response.headers.get('content-length')
    const maxSize = 5 * 1024 * 1024 // 5MB limit

    if (contentLength && Number.parseInt(contentLength) > maxSize) {
      return {
        success: false,
        error: 'File too large. Maximum allowed size is 5MB.',
      }
    }

    // Stream reading with size limit for safety
    const reader = response.body?.getReader()
    if (!reader) {
      return {
        success: false,
        error: 'Unable to read response stream',
      }
    }

    const chunks: Uint8Array[] = []
    let totalSize = 0

    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      if (value) {
        totalSize += value.length
        if (totalSize > maxSize) {
          return {
            success: false,
            error: 'File too large. Maximum allowed size is 5MB.',
          }
        }
        chunks.push(value)
      }
    }

    // Combine all chunks into a single Uint8Array
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    const result = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of chunks) {
      result.set(chunk, offset)
      offset += chunk.length
    }

    const content = new TextDecoder().decode(result)

    return {
      success: true,
      content,
    }
  } catch (error) {
    // Handle timeout specifically
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timed out. Please try again or check the URL.',
      }
    }

    return {
      success: false,
      error: `Failed to fetch schema: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}
