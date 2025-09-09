import { describe, expect, it } from 'vitest'
import { isValidReturnPath, sanitizeReturnPath } from './validateReturnPath'

describe('validateReturnPath', () => {
  describe('isValidReturnPath', () => {
    describe('valid paths', () => {
      it('should accept simple relative paths', () => {
        expect(isValidReturnPath('/')).toBe(true)
        expect(isValidReturnPath('/home')).toBe(true)
        expect(isValidReturnPath('/projects')).toBe(true)
        expect(isValidReturnPath('/design_sessions/new')).toBe(true)
      })

      it('should accept paths with query parameters', () => {
        expect(isValidReturnPath('/login?next=/dashboard')).toBe(true)
        expect(isValidReturnPath('/search?q=test&page=2')).toBe(true)
      })

      it('should accept paths with hash fragments', () => {
        expect(isValidReturnPath('/docs#section-1')).toBe(true)
        expect(isValidReturnPath('/about#team')).toBe(true)
      })

      it('should accept nested paths', () => {
        expect(isValidReturnPath('/projects/123/settings')).toBe(true)
        expect(isValidReturnPath('/organizations/abc/members')).toBe(true)
      })

      it('should accept paths with special characters', () => {
        expect(isValidReturnPath('/projects/test-123')).toBe(true)
        expect(isValidReturnPath('/files/my_document.pdf')).toBe(true)
        expect(isValidReturnPath('/search?q=hello%20world')).toBe(true)
      })
    })

    describe('invalid paths', () => {
      it('should reject empty or null paths', () => {
        expect(isValidReturnPath('')).toBe(false)
        // @ts-expect-error - Testing invalid input
        expect(isValidReturnPath(null)).toBe(false)
        // @ts-expect-error - Testing invalid input
        expect(isValidReturnPath(undefined)).toBe(false)
      })

      it('should reject paths containing CR/LF and control characters', () => {
        // Direct newline and carriage return characters
        expect(isValidReturnPath('/path\nwith\nnewlines')).toBe(false)
        expect(isValidReturnPath('/path\rwith\rcarriage')).toBe(false)
        expect(isValidReturnPath('/path\r\nwith\r\ncrlf')).toBe(false)

        // URL encoded CR/LF
        expect(isValidReturnPath('/path%0awith%0anewlines')).toBe(false)
        expect(isValidReturnPath('/path%0dwith%0dcarriage')).toBe(false)
        expect(isValidReturnPath('/path%0a%0dheader%0a%0dinjection')).toBe(
          false,
        )

        // Mixed encoded and literal
        expect(isValidReturnPath('/path\n%0dmixed')).toBe(false)

        // Other control characters
        expect(isValidReturnPath('/path\twith\ttabs')).toBe(false)
        expect(isValidReturnPath('/path\x00null\x00bytes')).toBe(false)
        expect(isValidReturnPath('/path\x08backspace')).toBe(false)
        expect(isValidReturnPath('/path\x1bescape')).toBe(false)

        // Control characters at different positions
        expect(isValidReturnPath('\n/path')).toBe(false)
        expect(isValidReturnPath('/path\n')).toBe(false)
        expect(isValidReturnPath('/pa\nth')).toBe(false)

        // URL encoded variations (uppercase and lowercase)
        expect(isValidReturnPath('/path%0A%0D')).toBe(false)
        expect(isValidReturnPath('/path%0a%0d')).toBe(false)

        // Common header injection patterns
        expect(
          isValidReturnPath('/redirect%0d%0aLocation:%20http://evil.com'),
        ).toBe(false)
        expect(
          isValidReturnPath('/path%0aSet-Cookie:%20session=hijacked'),
        ).toBe(false)
      })

      it('should reject paths not starting with /', () => {
        expect(isValidReturnPath('home')).toBe(false)
        expect(isValidReturnPath('projects/123')).toBe(false)
        expect(isValidReturnPath('../parent')).toBe(false)
        expect(isValidReturnPath('./current')).toBe(false)
      })

      it('should reject absolute URLs with protocol', () => {
        expect(isValidReturnPath('http://example.com')).toBe(false)
        expect(isValidReturnPath('https://example.com')).toBe(false)
        expect(isValidReturnPath('ftp://example.com')).toBe(false)
        expect(isValidReturnPath('file:///etc/passwd')).toBe(false)
      })

      it('should reject protocol-relative URLs', () => {
        expect(isValidReturnPath('//example.com')).toBe(false)
        expect(isValidReturnPath('//evil.com/phishing')).toBe(false)
        expect(isValidReturnPath('///triple-slash')).toBe(false)
      })

      it('should reject javascript: and data: URLs', () => {
        expect(isValidReturnPath('javascript:alert(1)')).toBe(false)
        expect(isValidReturnPath('JavaScript:void(0)')).toBe(false)
        expect(
          isValidReturnPath('data:text/html,<script>alert(1)</script>'),
        ).toBe(false)
        expect(isValidReturnPath('DATA:text/plain,hello')).toBe(false)
      })

      it('should reject paths containing @', () => {
        expect(isValidReturnPath('/@evil.com')).toBe(false)
        expect(isValidReturnPath('/user@example.com')).toBe(false)
        expect(isValidReturnPath('/redirect@attacker.com')).toBe(false)
      })

      it('should reject URLs disguised as paths', () => {
        expect(isValidReturnPath('/http://example.com')).toBe(false)
        expect(isValidReturnPath('/https://malicious.site')).toBe(false)
        expect(isValidReturnPath('/?url=http://evil.com')).toBe(false)
      })
    })

    describe('edge cases', () => {
      it('should handle URL encoding attempts', () => {
        expect(isValidReturnPath('/%2F%2Fexample.com')).toBe(true) // Encoded // is treated as path
        expect(isValidReturnPath('/javascript%3Aalert(1)')).toBe(true) // Encoded javascript: is treated as path
        expect(isValidReturnPath('/%40example.com')).toBe(true) // Encoded @ is allowed
      })

      it('should handle very long paths', () => {
        const longPath = `/${'a'.repeat(1000)}`
        expect(isValidReturnPath(longPath)).toBe(true)
      })

      it('should handle paths with multiple slashes', () => {
        expect(isValidReturnPath('/path//with///multiple////slashes')).toBe(
          true,
        )
        expect(isValidReturnPath('/')).toBe(true)
      })
    })
  })

  describe('sanitizeReturnPath', () => {
    const defaultPath = '/default'

    describe('valid path handling', () => {
      it('should return valid paths unchanged', () => {
        expect(sanitizeReturnPath('/home', defaultPath)).toBe('/home')
        expect(sanitizeReturnPath('/projects/123', defaultPath)).toBe(
          '/projects/123',
        )
        expect(sanitizeReturnPath('/search?q=test', defaultPath)).toBe(
          '/search?q=test',
        )
      })

      it('should use custom default path when provided', () => {
        expect(sanitizeReturnPath('', '/custom')).toBe('/custom')
        expect(sanitizeReturnPath(null, '/custom')).toBe('/custom')
        expect(sanitizeReturnPath('invalid', '/custom')).toBe('/custom')
      })

      it('should use /design_sessions/new as default when not specified', () => {
        expect(sanitizeReturnPath('')).toBe('/design_sessions/new')
        expect(sanitizeReturnPath(null)).toBe('/design_sessions/new')
        expect(sanitizeReturnPath(undefined)).toBe('/design_sessions/new')
      })
    })

    describe('invalid path handling', () => {
      it('should return default for invalid paths', () => {
        expect(sanitizeReturnPath('http://evil.com', defaultPath)).toBe(
          defaultPath,
        )
        expect(sanitizeReturnPath('//evil.com', defaultPath)).toBe(defaultPath)
        expect(sanitizeReturnPath('javascript:alert(1)', defaultPath)).toBe(
          defaultPath,
        )
        expect(sanitizeReturnPath('/@evil.com', defaultPath)).toBe(defaultPath)
      })

      it('should handle null and undefined', () => {
        expect(sanitizeReturnPath(null, defaultPath)).toBe(defaultPath)
        expect(sanitizeReturnPath(undefined, defaultPath)).toBe(defaultPath)
      })

      it('should handle non-string values gracefully', () => {
        // @ts-expect-error - Testing invalid input
        expect(sanitizeReturnPath(123, defaultPath)).toBe(defaultPath)
        // @ts-expect-error - Testing invalid input
        expect(sanitizeReturnPath({}, defaultPath)).toBe(defaultPath)
        // @ts-expect-error - Testing invalid input
        expect(sanitizeReturnPath([], defaultPath)).toBe(defaultPath)
      })
    })

    describe('security scenarios', () => {
      it('should prevent open redirect via absolute URLs', () => {
        const maliciousUrls = [
          'http://phishing.site/login',
          'https://attacker.com',
          '//evil.com/steal-cookies',
          'javascript:document.cookie',
          'data:text/html,<script>alert(document.cookie)</script>',
        ]

        maliciousUrls.forEach((url) => {
          expect(sanitizeReturnPath(url, defaultPath)).toBe(defaultPath)
        })
      })

      it('should prevent bypass attempts', () => {
        const bypassAttempts = [
          '//google.com',
          '///triple.slash',
          '/@evil.com',
          'HtTp://evil.com', // Case variation
          'JAVASCRIPT:alert(1)', // Case variation
        ]

        bypassAttempts.forEach((attempt) => {
          expect(sanitizeReturnPath(attempt, defaultPath)).toBe(defaultPath)
        })
      })

      it('should allow legitimate application paths', () => {
        const legitimatePaths = [
          '/login',
          '/projects/abc-123/settings',
          '/organizations/new?from=header',
          '/design_sessions/456#comments',
          '/invitations/tokens/xyz789',
        ]

        legitimatePaths.forEach((path) => {
          expect(sanitizeReturnPath(path, defaultPath)).toBe(path)
        })
      })
    })
  })
})
