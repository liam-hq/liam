import type { FormatType } from '../../../../../components/FormatIcon/FormatIcon'
import {
  checkDemoErrorConditions,
  getDemoSchemaContent,
  simulateNetworkDelay,
} from './demoHelpers'

// Development version of fetchSchemaFromUrl with demo features
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

  // Step 2: Validate protocol (allow HTTP for development)
  const allowedProtocols = ['https:', 'http:']
  if (!allowedProtocols.includes(parsedUrl.protocol)) {
    return {
      success: false,
      error: `Unsupported protocol: ${parsedUrl.protocol}. Only HTTP(S) is allowed.`,
    }
  }

  // Step 3: Validate domain whitelist (relaxed for development)
  const allowedDomains = [
    'raw.githubusercontent.com',
    'github.com',
    'gitlab.com',
    'localhost',
    '127.0.0.1',
    // Add more trusted domains as needed
  ]

  const hostname = parsedUrl.hostname.toLowerCase()
  const isDomainAllowed = allowedDomains.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
  )

  // In development, allow any domain with a warning
  if (!isDomainAllowed) {
    console.warn(`Development mode: Allowing untrusted domain ${hostname}`)
  }

  // Step 4: Validate file extension
  const validExtensions = ['.sql', '.rb', '.prisma', '.json']
  const pathname = parsedUrl.pathname
  const hasValidExtension = validExtensions.some((ext) =>
    pathname.toLowerCase().endsWith(ext),
  )

  if (!hasValidExtension) {
    return {
      success: false,
      error: 'Invalid file type. Supported formats: .sql, .rb, .prisma, .json',
    }
  }

  // Step 5: Sanitize URL by removing unnecessary parts
  const sanitizedUrl = `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname}`

  // Simulate network delay for demo
  await simulateNetworkDelay()

  // Check for demo error conditions
  const demoError = checkDemoErrorConditions(url)
  if (demoError.hasError) {
    return {
      success: false,
      error: demoError.error,
    }
  }

  // In development, return demo content for certain URLs
  if (url.includes('demo') || url.includes('example')) {
    return {
      success: true,
      content: getDemoSchemaContent(),
    }
  }

  // Otherwise, attempt to fetch the actual schema
  try {
    const response = await fetch(sanitizedUrl, {
      method: 'GET',
      headers: {
        Accept: 'text/plain',
      },
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
    // In development, fallback to demo content on fetch errors
    console.warn('Failed to fetch schema, using demo content:', error)
    return {
      success: true,
      content: getDemoSchemaContent(),
    }
  }
}

// Re-export other functions from the main module
export {
  getFileNameFromUrl,
  getFormatFromUrl,
  isValidSchemaUrl,
} from './urlValidation'
