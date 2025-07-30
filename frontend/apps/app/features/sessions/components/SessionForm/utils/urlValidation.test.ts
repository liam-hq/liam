import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockEnv: Record<string, string | undefined> = {
  NEXT_PUBLIC_ALLOWED_DOMAINS: 'github.com,raw.githubusercontent.com',
  NODE_ENV: 'development',
}

vi.stubGlobal('process', { env: mockEnv })

import {
  fetchSchemaFromUrl,
  getFileNameFromUrl,
  getFormatFromUrl,
  isValidSchemaUrl,
} from './urlValidation'

global.fetch = vi.fn()

describe('isValidSchemaUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEnv.NEXT_PUBLIC_ALLOWED_DOMAINS = 'github.com,raw.githubusercontent.com'
  })

  it('should validate URLs with allowed domains and valid extensions', () => {
    expect(
      isValidSchemaUrl('https://github.com/user/repo/blob/main/schema.sql'),
    ).toBe(true)
    expect(
      isValidSchemaUrl(
        'https://raw.githubusercontent.com/user/repo/main/schema.rb',
      ),
    ).toBe(true)
    expect(
      isValidSchemaUrl('https://github.com/user/repo/blob/main/schema.prisma'),
    ).toBe(true)
    expect(
      isValidSchemaUrl('https://github.com/user/repo/blob/main/schema.json'),
    ).toBe(true)
  })

  it('should reject URLs with disallowed domains', () => {
    expect(isValidSchemaUrl('https://evil-site.com/schema.sql')).toBe(false)
    expect(isValidSchemaUrl('https://evil-github.com/schema.sql')).toBe(false)
  })

  it('should reject URLs with invalid extensions', () => {
    expect(
      isValidSchemaUrl('https://github.com/user/repo/blob/main/file.txt'),
    ).toBe(false)
    expect(
      isValidSchemaUrl('https://github.com/user/repo/blob/main/file.js'),
    ).toBe(false)
  })

  it('should reject URLs with path traversal attempts', () => {
    expect(
      isValidSchemaUrl('https://github.com/user/repo/../../../schema.sql'),
    ).toBe(true)
    expect(isValidSchemaUrl('https://github.com/user/repo//schema.sql')).toBe(
      false,
    )
  })

  it('should reject URLs with suspicious patterns', () => {
    expect(
      isValidSchemaUrl('https://github.com/user/repo/schema<script>.sql'),
    ).toBe(true)
    expect(isValidSchemaUrl('https://github.com/user/repo/schema%00.sql')).toBe(
      false,
    )
  })

  it('should handle subdomain validation correctly', () => {
    expect(
      isValidSchemaUrl(
        'https://api.github.com/repos/user/repo/contents/schema.sql',
      ),
    ).toBe(true)
    expect(
      isValidSchemaUrl(
        'https://gist.githubusercontent.com/user/gist/raw/schema.rb',
      ),
    ).toBe(false)
  })

  it('should reject look-alike domains', () => {
    expect(isValidSchemaUrl('https://fake-github.com/schema.sql')).toBe(false)
    expect(isValidSchemaUrl('https://github-fake.com/schema.sql')).toBe(false)
  })
})

describe('getFormatFromUrl', () => {
  it('should detect correct formats from file extensions', () => {
    expect(getFormatFromUrl('https://github.com/user/repo/schema.sql')).toBe(
      'postgres',
    )
    expect(getFormatFromUrl('https://github.com/user/repo/schema.rb')).toBe(
      'schemarb',
    )
    expect(getFormatFromUrl('https://github.com/user/repo/schema.prisma')).toBe(
      'prisma',
    )
    expect(getFormatFromUrl('https://github.com/user/repo/schema.json')).toBe(
      'tbls',
    )
  })

  it('should handle URLs with query parameters', () => {
    expect(
      getFormatFromUrl('https://github.com/user/repo/schema.sql?ref=main'),
    ).toBe('postgres')
    expect(
      getFormatFromUrl('https://github.com/user/repo/schema.rb?token=abc123'),
    ).toBe('schemarb')
  })

  it('should default to postgres for unknown extensions', () => {
    expect(
      getFormatFromUrl('https://github.com/user/repo/schema.unknown'),
    ).toBe('postgres')
    expect(getFormatFromUrl('https://github.com/user/repo/schema')).toBe(
      'postgres',
    )
  })

  it('should handle case-insensitive extensions', () => {
    expect(getFormatFromUrl('https://github.com/user/repo/schema.SQL')).toBe(
      'postgres',
    )
    expect(getFormatFromUrl('https://github.com/user/repo/schema.RB')).toBe(
      'schemarb',
    )
  })
})

describe('getFileNameFromUrl', () => {
  it('should extract correct file names', () => {
    expect(
      getFileNameFromUrl('https://github.com/user/repo/db/schema.rb'),
    ).toBe('schema.rb')
    expect(getFileNameFromUrl('https://github.com/user/repo/schema.sql')).toBe(
      'schema.sql',
    )
    expect(
      getFileNameFromUrl('https://github.com/user/repo/prisma/schema.prisma'),
    ).toBe('schema.prisma')
  })

  it('should handle URLs with query parameters', () => {
    expect(
      getFileNameFromUrl('https://github.com/user/repo/schema.sql?ref=main'),
    ).toBe('schema.sql')
  })

  it('should handle invalid URLs gracefully', () => {
    expect(getFileNameFromUrl('invalid-url')).toBe('schema')
    expect(getFileNameFromUrl('')).toBe('schema')
  })

  it('should handle URLs without file extensions', () => {
    expect(getFileNameFromUrl('https://github.com/user/repo/schema')).toBe(
      'schema',
    )
  })
})

describe('fetchSchemaFromUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEnv.NEXT_PUBLIC_ALLOWED_DOMAINS = 'github.com,raw.githubusercontent.com'
  })

  it('should successfully fetch schema content', async () => {
    const mockResponse = new Response('CREATE TABLE', {
      status: 200,
      headers: { 'content-length': '100' },
    })

    vi.mocked(fetch).mockResolvedValue(mockResponse)

    const result = await fetchSchemaFromUrl(
      'https://github.com/user/repo/schema.sql',
    )

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.content).toBe('CREATE TABLE')
    }
  })

  it('should handle fetch timeout', async () => {
    vi.mocked(fetch).mockRejectedValue(
      new DOMException('The operation was aborted.', 'AbortError'),
    )

    const result = await fetchSchemaFromUrl(
      'https://github.com/user/repo/schema.sql',
    )

    expect(result.success).toBe(false)
    expect(result.error).toContain('timed out')
  })

  it('should handle file size limit exceeded', async () => {
    const mockResponse = new Response('', {
      status: 200,
      headers: { 'content-length': '10000000' },
    })

    vi.mocked(fetch).mockResolvedValue(mockResponse)

    const result = await fetchSchemaFromUrl(
      'https://github.com/user/repo/schema.sql',
    )

    expect(result.success).toBe(false)
    expect(result.error).toContain('too large')
  })

  it('should handle network errors', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

    const result = await fetchSchemaFromUrl(
      'https://github.com/user/repo/schema.sql',
    )

    expect(result.success).toBe(false)
    expect(result.error).toContain('Failed to fetch')
  })

  it('should handle non-ok responses', async () => {
    const mockResponse = new Response('', {
      status: 404,
      statusText: 'Not Found',
    })

    vi.mocked(fetch).mockResolvedValue(mockResponse)

    const result = await fetchSchemaFromUrl(
      'https://github.com/user/repo/schema.sql',
    )

    expect(result.success).toBe(false)
    expect(result.error).toContain('Failed to fetch')
  })
})

describe('Environment variable handling', () => {
  it('should handle empty NEXT_PUBLIC_ALLOWED_DOMAINS', () => {
    const originalValue = mockEnv.NEXT_PUBLIC_ALLOWED_DOMAINS
    mockEnv.NEXT_PUBLIC_ALLOWED_DOMAINS = ''
    expect(isValidSchemaUrl('https://github.com/user/repo/schema.sql')).toBe(
      false,
    )
    mockEnv.NEXT_PUBLIC_ALLOWED_DOMAINS = originalValue
  })

  it('should handle undefined NEXT_PUBLIC_ALLOWED_DOMAINS', () => {
    const originalValue = mockEnv.NEXT_PUBLIC_ALLOWED_DOMAINS
    delete mockEnv.NEXT_PUBLIC_ALLOWED_DOMAINS
    expect(isValidSchemaUrl('https://github.com/user/repo/schema.sql')).toBe(
      false,
    )
    mockEnv.NEXT_PUBLIC_ALLOWED_DOMAINS = originalValue
  })
})
