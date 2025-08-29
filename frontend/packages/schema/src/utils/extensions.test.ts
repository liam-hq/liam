import { describe, expect, it } from 'vitest'
import {
  getPGliteJavaScriptName,
  isPGliteSupportedExtension,
  PGLITE_SUPPORTED_EXTENSIONS,
} from './extensions'

describe('PGlite Extension Utilities', () => {
  describe('isPGliteSupportedExtension', () => {
    it('should return true for supported extensions', () => {
      expect(isPGliteSupportedExtension('uuid-ossp')).toBe(true)
      expect(isPGliteSupportedExtension('vector')).toBe(true)
      expect(isPGliteSupportedExtension('pg_trgm')).toBe(true)
    })

    it('should return false for unsupported extensions', () => {
      expect(isPGliteSupportedExtension('postgis')).toBe(false)
      expect(isPGliteSupportedExtension('random_extension')).toBe(false)
    })

    it('should handle case-insensitive and quoted names', () => {
      expect(isPGliteSupportedExtension('UUID-OSSP')).toBe(true)
      expect(isPGliteSupportedExtension('"uuid-ossp"')).toBe(true)
      expect(isPGliteSupportedExtension('uuid_ossp')).toBe(true)
    })
  })

  describe('getPGliteJavaScriptName', () => {
    it('should map uuid-ossp to uuid_ossp', () => {
      expect(getPGliteJavaScriptName('uuid-ossp')).toBe('uuid_ossp')
      expect(getPGliteJavaScriptName('UUID-OSSP')).toBe('uuid_ossp')
      expect(getPGliteJavaScriptName('"uuid-ossp"')).toBe('uuid_ossp')
    })

    it('should return same name for extensions without special mapping', () => {
      expect(getPGliteJavaScriptName('vector')).toBe('vector')
      expect(getPGliteJavaScriptName('pg_trgm')).toBe('pg_trgm')
    })

    it('should return hyphenated fallback for unknown extensions', () => {
      expect(getPGliteJavaScriptName('unknown_extension')).toBe(
        'unknown-extension',
      )
    })
  })

  describe('PGLITE_SUPPORTED_EXTENSIONS', () => {
    it('should contain core extensions', () => {
      const coreExtensions = ['uuid-ossp', 'vector', 'hstore', 'pg_trgm']

      for (const ext of coreExtensions) {
        expect(PGLITE_SUPPORTED_EXTENSIONS.has(ext)).toBe(true)
      }
    })
  })
})
