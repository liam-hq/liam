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
  // replace the old ternary-based URL.canParse check with a simple if/else and early returns
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
  const parsedUrl = new URL(url)

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
  const pathname = URL.canParse(url)
    ? new URL(url).pathname
    : url.split('?')[0].split('#')[0]

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
  if (!URL.canParse(url)) {
    return 'schema'
  }
  const urlObj = new URL(url)
  const pathname = urlObj.pathname
  const fileName = pathname.split('/').pop() || 'schema'
  return fileName
}

const isAllowedDevPort = (port: string): boolean => {
  const allowedPorts = ['3000', '3001', '4000', '5000', '8000', '8080', '8081']
  return allowedPorts.includes(port) || port === '80'
}

const isSensitiveLocalPath = (pathname: string): boolean => {
  const suspiciousPaths = ['/admin', '/api', '/config', '/.env', '/secret']
  return suspiciousPaths.some((path) => pathname.toLowerCase().startsWith(path))
}

// Validate URL format
const validateUrlFormat = (url: string): { valid: boolean; error?: string } => {
  if (!URL.canParse(url)) {
    return {
      valid: false,
      error: 'Invalid URL format. Please provide a valid URL.',
    }
  }
  return { valid: true }
}

// Validate protocol
const validateProtocol = (
  parsedUrl: URL,
  isDev: boolean,
  isLocalhost: boolean,
): { valid: boolean; error?: string } => {
  const allowedProtocols: ReadonlyArray<string> =
    isDev && isLocalhost ? ['https:', 'http:'] : ['https:']

  if (!allowedProtocols.includes(parsedUrl.protocol)) {
    const protocolError =
      isDev && parsedUrl.protocol === 'http:'
        ? `HTTP is only allowed for localhost in development. Use HTTPS for ${parsedUrl.hostname}.`
        : `Unsupported protocol: ${parsedUrl.protocol}. Only HTTPS is allowed.`
    return { valid: false, error: protocolError }
  }
  return { valid: true }
}

// Validate localhost in development
const validateLocalhostDev = (
  parsedUrl: URL,
): { valid: boolean; error?: string } => {
  const port = parsedUrl.port || '80'
  if (!isAllowedDevPort(port)) {
    return {
      valid: false,
      error: `Localhost port ${port} is not allowed. Use common development ports.`,
    }
  }

  if (isSensitiveLocalPath(parsedUrl.pathname)) {
    return {
      valid: false,
      error: 'Access to sensitive localhost paths is not allowed.',
    }
  }
  return { valid: true }
}

// Check if domain is allowed
const isDomainAllowed = (
  hostname: string,
  allowedDomains: string[],
): boolean => {
  return allowedDomains.some((domain) => {
    if (hostname === domain) return true
    if (hostname.endsWith(`.${domain}`)) {
      const beforeDomain = hostname.slice(0, -(domain.length + 1))
      if (beforeDomain.endsWith('-')) return false // Block evil-github.com
      return true
    }
    return false
  })
}

// Validate domain
const validateDomain = (
  hostname: string,
  allowedDomains: string[],
  isDev: boolean,
): { valid: boolean; error?: string } => {
  const isAllowed = isDomainAllowed(hostname, allowedDomains)
  const isLocalhostAllowed =
    isDev && ['localhost', '127.0.0.1'].includes(hostname)

  if (!isAllowed && !isLocalhostAllowed) {
    return {
      valid: false,
      error: `Domain not allowed: ${hostname}. Please use a trusted source.`,
    }
  }
  return { valid: true }
}

// Fetch content from URL with timeout
const fetchWithTimeout = async (
  url: string,
  timeoutMs = 10000,
): Promise<Response> => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'text/plain',
        'User-Agent': 'liam-schema-fetcher/1.0',
      },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

// Read response body with size limit
const readResponseWithSizeLimit = async (
  response: Response,
  maxSize: number,
): Promise<{ success: boolean; content?: string; error?: string }> => {
  // Check content length header
  const contentLength = response.headers.get('content-length')
  if (contentLength && Number.parseInt(contentLength) > maxSize) {
    return {
      success: false,
      error: 'File too large. Maximum allowed size is 5MB.',
    }
  }

  // Stream reading with size limit
  const reader = response.body?.getReader()
  if (!reader) {
    return {
      success: false,
      error: 'Unable to read response stream',
    }
  }

  const chunks: Uint8Array[] = []
  let totalSize = 0

  try {
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

    // Combine chunks and decode
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    const result = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of chunks) {
      result.set(chunk, offset)
      offset += chunk.length
    }

    const content = new TextDecoder().decode(result)
    return { success: true, content }
  } finally {
    reader.releaseLock()
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
  // Step 1: Validate URL format
  const urlValidation = validateUrlFormat(url)
  if (!urlValidation.valid) {
    return { success: false, error: urlValidation.error }
  }

  const parsedUrl = new URL(url)
  const hostname = parsedUrl.hostname.toLowerCase()
  const isDev = process.env.NODE_ENV === 'development'
  const isLocalhost = ['localhost', '127.0.0.1'].includes(hostname)

  // Step 2: Validate protocol
  const protocolValidation = validateProtocol(parsedUrl, isDev, isLocalhost)
  if (!protocolValidation.valid) {
    return { success: false, error: protocolValidation.error }
  }

  // Step 3: Validate localhost in development
  if (isDev && isLocalhost) {
    const localhostValidation = validateLocalhostDev(parsedUrl)
    if (!localhostValidation.valid) {
      return { success: false, error: localhostValidation.error }
    }
  }

  // Step 4: Validate domain whitelist
  const allowedDomains = parseAllowedDomains()
  const domainValidation = validateDomain(hostname, allowedDomains, isDev)
  if (!domainValidation.valid) {
    return { success: false, error: domainValidation.error }
  }

  // Step 5: Validate file extension
  if (!isValidSchemaUrl(url)) {
    return {
      success: false,
      error: 'Invalid file type. Supported formats: .sql, .rb, .prisma, .json',
    }
  }

  // Step 6: Sanitize URL by removing unnecessary parts
  const sanitizedUrl = `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname}`

  try {
    // Fetch with timeout
    const response = await fetchWithTimeout(sanitizedUrl)

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch schema: HTTP ${response.status}`,
      }
    }

    // Read response with size limit
    const maxSize = 5 * 1024 * 1024 // 5MB limit
    return await readResponseWithSizeLimit(response, maxSize)
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
