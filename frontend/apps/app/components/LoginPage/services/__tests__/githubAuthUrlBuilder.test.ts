import { describe, expect, it } from 'vitest'

// Pure function for URL construction - extracted from loginByGithub for testability
function buildAuthCallbackUrl({
  next = '/app/design_sessions/new',
  provider,
  siteUrl,
  vercelBranchUrl,
}: {
  next?: string
  provider: 'github'
  siteUrl?: string
  vercelBranchUrl?: string
  nodeEnv?: string
}): string {
  let url = siteUrl
    ? `https://${siteUrl}`
    : vercelBranchUrl
      ? `https://${vercelBranchUrl}`
      : 'http://localhost:3001/'
  url = url.endsWith('/') ? url : `${url}/`
  return `${url}app/auth/callback/${provider}?next=${encodeURIComponent(next)}`
}

describe('buildAuthCallbackUrl - Pure Function Tests', () => {
  describe('URL construction with different environment configurations', () => {
    it('should build callback URL with SITE_URL when available', () => {
      // Given: production environment with SITE_URL
      const config = {
        provider: 'github' as const,
        siteUrl: 'example.com',
        nodeEnv: 'production',
      }

      // When: building callback URL
      const result = buildAuthCallbackUrl(config)

      // Then: uses SITE_URL for callback
      expect(result).toBe(
        'https://example.com/app/auth/callback/github?next=%2Fapp%2Fdesign_sessions%2Fnew',
      )
    })

    it('should use VERCEL_BRANCH_URL when SITE_URL is not available', () => {
      // Given: Vercel preview environment
      const config = {
        provider: 'github' as const,
        vercelBranchUrl: 'feature-branch-abc123.vercel.app',
        nodeEnv: 'preview',
      }

      // When: building callback URL
      const result = buildAuthCallbackUrl(config)

      // Then: uses Vercel branch URL for callback
      expect(result).toBe(
        'https://feature-branch-abc123.vercel.app/app/auth/callback/github?next=%2Fapp%2Fdesign_sessions%2Fnew',
      )
    })

    it('should default to localhost when no environment URLs are provided', () => {
      // Given: development environment without configured URLs
      const config = {
        provider: 'github' as const,
        nodeEnv: 'development',
      }

      // When: building callback URL
      const result = buildAuthCallbackUrl(config)

      // Then: defaults to localhost
      expect(result).toBe(
        'http://localhost:3001/app/auth/callback/github?next=%2Fapp%2Fdesign_sessions%2Fnew',
      )
    })

    it('should handle URLs with trailing slashes correctly', () => {
      // Given: SITE_URL with trailing slash
      const config = {
        provider: 'github' as const,
        siteUrl: 'example.com/',
      }

      // When: building callback URL
      const result = buildAuthCallbackUrl(config)

      // Then: avoids double slashes in URL
      expect(result).toBe(
        'https://example.com/app/auth/callback/github?next=%2Fapp%2Fdesign_sessions%2Fnew',
      )
    })
  })

  describe('return path handling', () => {
    it('should use default path when next parameter is not specified', () => {
      // Given: no custom return path
      const config = {
        provider: 'github' as const,
        siteUrl: 'example.com',
      }

      // When: building callback URL
      const result = buildAuthCallbackUrl(config)

      // Then: uses default design sessions path
      expect(result).toBe(
        'https://example.com/app/auth/callback/github?next=%2Fapp%2Fdesign_sessions%2Fnew',
      )
    })

    it('should use custom return path when specified', () => {
      // Given: custom return path
      const config = {
        provider: 'github' as const,
        next: '/app/projects',
        siteUrl: 'example.com',
      }

      // When: building callback URL
      const result = buildAuthCallbackUrl(config)

      // Then: uses custom path in callback URL
      expect(result).toBe(
        'https://example.com/app/auth/callback/github?next=%2Fapp%2Fprojects',
      )
    })

    it('should properly encode complex return paths with query parameters', () => {
      // Given: return path with query parameters and special characters
      const config = {
        provider: 'github' as const,
        next: '/app/projects?filter=active&sort=name&category=backend%20services',
        siteUrl: 'example.com',
      }

      // When: building callback URL
      const result = buildAuthCallbackUrl(config)

      // Then: return path is properly URL encoded
      expect(result).toBe(
        'https://example.com/app/auth/callback/github?next=%2Fapp%2Fprojects%3Ffilter%3Dactive%26sort%3Dname%26category%3Dbackend%2520services',
      )
    })

    it('should handle paths with hash fragments', () => {
      // Given: return path with hash fragment
      const config = {
        provider: 'github' as const,
        next: '/app/erd#table-users',
        siteUrl: 'example.com',
      }

      // When: building callback URL
      const result = buildAuthCallbackUrl(config)

      // Then: hash fragment is properly encoded
      expect(result).toBe(
        'https://example.com/app/auth/callback/github?next=%2Fapp%2Ferd%23table-users',
      )
    })
  })

  describe('edge cases', () => {
    it('should handle empty string paths', () => {
      // Given: empty return path
      const config = {
        provider: 'github' as const,
        next: '',
        siteUrl: 'example.com',
      }

      // When: building callback URL
      const result = buildAuthCallbackUrl(config)

      // Then: handles empty path gracefully
      expect(result).toBe('https://example.com/app/auth/callback/github?next=')
    })

    it('should handle root path', () => {
      // Given: root path as return destination
      const config = {
        provider: 'github' as const,
        next: '/',
        siteUrl: 'example.com',
      }

      // When: building callback URL
      const result = buildAuthCallbackUrl(config)

      // Then: encodes root path correctly
      expect(result).toBe(
        'https://example.com/app/auth/callback/github?next=%2F',
      )
    })

    it('should prioritize SITE_URL over VERCEL_BRANCH_URL when both are present', () => {
      // Given: both SITE_URL and VERCEL_BRANCH_URL configured
      const config = {
        provider: 'github' as const,
        siteUrl: 'production.com',
        vercelBranchUrl: 'feature-branch.vercel.app',
      }

      // When: building callback URL
      const result = buildAuthCallbackUrl(config)

      // Then: SITE_URL takes precedence
      expect(result).toBe(
        'https://production.com/app/auth/callback/github?next=%2Fapp%2Fdesign_sessions%2Fnew',
      )
    })
  })
})
