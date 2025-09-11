import * as v from 'valibot'
import { describe, expect, it } from 'vitest'
import {
  RelativeReturnPathSchema,
  sanitizeReturnPath,
} from './validateReturnPath'

describe('validateReturnPath', () => {
  describe('sanitizeReturnPath', () => {
    const defaultPath = '/default'

    describe('valid paths', () => {
      it('should return valid relative paths unchanged', () => {
        expect(sanitizeReturnPath('/', defaultPath)).toBe('/')
        expect(sanitizeReturnPath('/home', defaultPath)).toBe('/home')
        expect(sanitizeReturnPath('/projects/123', defaultPath)).toBe(
          '/projects/123',
        )
        expect(sanitizeReturnPath('/design_sessions/new', defaultPath)).toBe(
          '/design_sessions/new',
        )
      })

      it('should accept paths with query parameters and hash fragments', () => {
        expect(sanitizeReturnPath('/login?next=/dashboard', defaultPath)).toBe(
          '/login?next=/dashboard',
        )
        expect(sanitizeReturnPath('/search?q=test&page=2', defaultPath)).toBe(
          '/search?q=test&page=2',
        )
        expect(sanitizeReturnPath('/docs#section-1', defaultPath)).toBe(
          '/docs#section-1',
        )
        expect(
          sanitizeReturnPath('/search?q=http://example.com', defaultPath),
        ).toBe('/search?q=http://example.com')
      })

      it('should accept nested paths', () => {
        expect(sanitizeReturnPath('/projects/123/settings', defaultPath)).toBe(
          '/projects/123/settings',
        )
        expect(
          sanitizeReturnPath('/organizations/abc/members', defaultPath),
        ).toBe('/organizations/abc/members')
      })
    })

    describe('invalid paths', () => {
      it('should return default for empty or null paths', () => {
        expect(sanitizeReturnPath('', defaultPath)).toBe(defaultPath)
        expect(sanitizeReturnPath(null, defaultPath)).toBe(defaultPath)
        expect(sanitizeReturnPath(undefined, defaultPath)).toBe(defaultPath)
      })

      it('should return default for paths not starting with /', () => {
        expect(sanitizeReturnPath('home', defaultPath)).toBe(defaultPath)
        expect(sanitizeReturnPath('projects/123', defaultPath)).toBe(
          defaultPath,
        )
        expect(sanitizeReturnPath('../parent', defaultPath)).toBe(defaultPath)
        expect(sanitizeReturnPath('./current', defaultPath)).toBe(defaultPath)
      })

      it('should return default for absolute URLs', () => {
        expect(sanitizeReturnPath('http://example.com', defaultPath)).toBe(
          defaultPath,
        )
        expect(sanitizeReturnPath('https://example.com', defaultPath)).toBe(
          defaultPath,
        )
        expect(sanitizeReturnPath('ftp://example.com', defaultPath)).toBe(
          defaultPath,
        )
        expect(sanitizeReturnPath('javascript:alert(1)', defaultPath)).toBe(
          defaultPath,
        )
        expect(
          sanitizeReturnPath(
            'data:text/html,<script>alert(1)</script>',
            defaultPath,
          ),
        ).toBe(defaultPath)
      })

      it('should return default for protocol-relative URLs', () => {
        expect(sanitizeReturnPath('//example.com', defaultPath)).toBe(
          defaultPath,
        )
        expect(sanitizeReturnPath('//evil.com/phishing', defaultPath)).toBe(
          defaultPath,
        )
        expect(sanitizeReturnPath('///triple-slash', defaultPath)).toBe(
          defaultPath,
        )
      })
    })

    describe('default path behavior', () => {
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
  })

  describe('RelativeReturnPathSchema', () => {
    it('should validate correct paths', () => {
      const validPaths = [
        '/',
        '/home',
        '/projects/123',
        '/search?q=test',
        '/docs#section',
        '/path/with/many/segments',
      ]

      validPaths.forEach((path) => {
        const result = v.safeParse(RelativeReturnPathSchema, path)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.output).toBe(path)
        }
      })
    })

    it('should reject invalid paths', () => {
      const invalidPaths = [
        '',
        'home',
        '//example.com',
        'http://example.com',
        'javascript:alert(1)',
        '../parent',
        './current',
      ]

      invalidPaths.forEach((path) => {
        const result = v.safeParse(RelativeReturnPathSchema, path)
        expect(result.success).toBe(false)
      })
    })

    it('should provide meaningful error message', () => {
      const result = v.safeParse(RelativeReturnPathSchema, '//evil.com')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.issues[0].message).toBe(
          'Path must be a relative path starting with /',
        )
      }
    })

    it('should be reusable in other schemas', () => {
      // Demonstrate that the schema can be composed with other valibot schemas
      const FormSchema = v.object({
        returnTo: v.optional(RelativeReturnPathSchema),
        username: v.string(),
      })

      const validForm = { username: 'john', returnTo: '/dashboard' }
      const invalidForm = { username: 'john', returnTo: '//evil.com' }

      expect(v.safeParse(FormSchema, validForm).success).toBe(true)
      expect(v.safeParse(FormSchema, invalidForm).success).toBe(false)
    })
  })
})
