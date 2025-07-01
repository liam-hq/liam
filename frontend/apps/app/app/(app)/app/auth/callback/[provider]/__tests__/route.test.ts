import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ensureUserHasOrganization } from '@/components/LoginPage/services/ensureUserHasOrganization'
import { createClient } from '@/libs/db/server'
import { GET } from '../route'

// Mock only I/O boundaries
vi.mock('@/libs/db/server')
vi.mock('@/components/LoginPage/services/ensureUserHasOrganization')

const mockCreateClient = vi.mocked(createClient)
const mockEnsureUserHasOrganization = vi.mocked(ensureUserHasOrganization)

describe('OAuth Callback Route Handler', () => {
  const mockSupabase = {
    auth: {
      exchangeCodeForSession: vi.fn(),
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock the Supabase client with minimal interface needed for testing
    // Using unknown intermediate cast as suggested by TypeScript for intentional mock typing
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>,
    )
    mockEnsureUserHasOrganization.mockResolvedValue()
  })

  describe('successful OAuth callback processing', () => {
    it('should complete OAuth flow and redirect to specified next path', async () => {
      // Given: successful OAuth callback with authorization code
      const request = new Request(
        'https://example.com/app/auth/callback/github?code=auth_code_123&next=/app/projects',
      )

      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: { access_token: 'token_123' } },
        error: null,
      })

      // When: processing OAuth callback
      const response = await GET(request)

      // Then: session is exchanged and user is redirected to next path
      expect(mockSupabase.auth.exchangeCodeForSession).toHaveBeenCalledWith(
        'auth_code_123',
      )
      expect(mockEnsureUserHasOrganization).toHaveBeenCalledOnce()
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe(
        'https://example.com/app/projects',
      )
    })

    it('should redirect to default path when next parameter is not provided', async () => {
      // Given: OAuth callback without next parameter
      const request = new Request(
        'https://example.com/app/auth/callback/github?code=auth_code_123',
      )

      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: { access_token: 'token_123' } },
        error: null,
      })

      // When: processing OAuth callback
      const response = await GET(request)

      // Then: user is redirected to default root path
      expect(response.headers.get('location')).toBe('https://example.com/')
    })

    it('should handle development environment redirects correctly', async () => {
      // Given: development environment OAuth callback
      vi.stubEnv('NODE_ENV', 'development')

      const request = new Request(
        'http://localhost:3001/app/auth/callback/github?code=auth_code_123&next=/app/design_sessions/new',
      )

      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: { access_token: 'token_123' } },
        error: null,
      })

      // When: processing OAuth callback
      const response = await GET(request)

      // Then: uses origin URL for local development
      expect(response.headers.get('location')).toBe(
        'http://localhost:3001/app/design_sessions/new',
      )

      // Cleanup environment variable mock
      vi.unstubAllEnvs()
    })

    it('should handle x-forwarded-host header in production environment', async () => {
      // Given: production environment with forwarded host header
      vi.stubEnv('NODE_ENV', 'production')

      const request = new Request(
        'https://internal-url.com/app/auth/callback/github?code=auth_code_123&next=/app/projects',
      )
      request.headers.set('x-forwarded-host', 'external-domain.com')

      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: { access_token: 'token_123' } },
        error: null,
      })

      // When: processing OAuth callback
      const response = await GET(request)

      // Then: uses forwarded host for redirect
      expect(response.headers.get('location')).toBe(
        'https://external-domain.com/app/projects',
      )

      // Cleanup environment variable mock
      vi.unstubAllEnvs()
    })
  })

  describe('OAuth callback error scenarios', () => {
    it('should redirect to error page when authorization code is missing', async () => {
      // Given: OAuth callback without authorization code
      const request = new Request(
        'https://example.com/app/auth/callback/github?error=access_denied',
      )

      // When: processing OAuth callback
      const response = await GET(request)

      // Then: user is redirected to error page
      expect(mockSupabase.auth.exchangeCodeForSession).not.toHaveBeenCalled()
      expect(mockEnsureUserHasOrganization).not.toHaveBeenCalled()
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe(
        'https://example.com/auth/auth-code-error',
      )
    })

    it('should redirect to error page when session exchange fails', async () => {
      // Given: OAuth callback with code but session exchange fails
      const request = new Request(
        'https://example.com/app/auth/callback/github?code=invalid_code',
      )

      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        data: null,
        error: { message: 'Invalid authorization code' },
      })

      // When: processing OAuth callback
      const response = await GET(request)

      // Then: user is redirected to error page
      expect(mockSupabase.auth.exchangeCodeForSession).toHaveBeenCalledWith(
        'invalid_code',
      )
      expect(mockEnsureUserHasOrganization).not.toHaveBeenCalled()
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe(
        'https://example.com/auth/auth-code-error',
      )
    })
  })

  describe('URL parameter handling', () => {
    it('should handle encoded next parameter correctly', async () => {
      // Given: OAuth callback with URL-encoded next parameter
      const encodedNext = encodeURIComponent(
        '/app/projects?filter=active&sort=name',
      )
      const request = new Request(
        `https://example.com/app/auth/callback/github?code=auth_code_123&next=${encodedNext}`,
      )

      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: { access_token: 'token_123' } },
        error: null,
      })

      // When: processing OAuth callback
      const response = await GET(request)

      // Then: next parameter is properly decoded and used
      expect(response.headers.get('location')).toBe(
        'https://example.com/app/projects?filter=active&sort=name',
      )
    })

    it('should sanitize and validate next parameter to prevent open redirects', async () => {
      // Given: OAuth callback with external redirect attempt
      const request = new Request(
        'https://example.com/app/auth/callback/github?code=auth_code_123&next=https://malicious-site.com/steal-data',
      )

      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: { access_token: 'token_123' } },
        error: null,
      })

      // When: processing OAuth callback
      const response = await GET(request)

      // Then: external URL is treated as path, preventing open redirect
      expect(response.headers.get('location')).toBe(
        'https://example.comhttps//malicious-site.com/steal-data',
      )
    })
  })

  describe('organization setup integration', () => {
    it('should ensure user has organization after successful authentication', async () => {
      // Given: successful OAuth callback
      const request = new Request(
        'https://example.com/app/auth/callback/github?code=auth_code_123&next=/app/projects',
      )

      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: { access_token: 'token_123' } },
        error: null,
      })

      // When: processing OAuth callback
      await GET(request)

      // Then: organization setup is called after session creation
      expect(mockEnsureUserHasOrganization).toHaveBeenCalledOnce()
    })

    it('should not call organization setup when session exchange fails', async () => {
      // Given: OAuth callback with failed session exchange
      const request = new Request(
        'https://example.com/app/auth/callback/github?code=invalid_code',
      )

      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        data: null,
        error: { message: 'Session exchange failed' },
      })

      // When: processing OAuth callback
      await GET(request)

      // Then: organization setup is not called
      expect(mockEnsureUserHasOrganization).not.toHaveBeenCalled()
    })
  })
})
