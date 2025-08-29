import {
  getPGliteJavaScriptName,
  PGLITE_SUPPORTED_EXTENSIONS,
} from '@liam-hq/schema'
import { describe, expect, it } from 'vitest'
import {
  extractRequiredExtensions,
  getExtensionConfiguration,
  isExtensionSupported,
} from './extensions'

describe('PGlite Extension Utilities', () => {
  describe('extractRequiredExtensions', () => {
    it('should extract extensions from schema', () => {
      const schema = {
        tables: {},
        enums: {},
        extensions: {
          'uuid-ossp': { name: 'uuid-ossp' },
          vector: { name: 'vector' },
        },
      }
      const extensions = extractRequiredExtensions(schema)
      expect(extensions).toEqual(['uuid-ossp', 'vector'])
    })

    it('should return empty array when no extensions in schema', () => {
      const schema = {
        tables: {},
        enums: {},
        extensions: {},
      }
      const extensions = extractRequiredExtensions(schema)
      expect(extensions).toEqual([])
    })

    it('should return empty array when schema is undefined', () => {
      const extensions = extractRequiredExtensions(undefined)
      expect(extensions).toEqual([])
    })
  })

  describe('getPGliteJavaScriptName', () => {
    const testCases = [
      {
        sql: 'uuid-ossp',
        js: 'uuid_ossp',
        description: 'convert hyphens to underscores',
      },
      { sql: 'vector', js: 'vector', description: 'keep vector as is' },
      { sql: 'hstore', js: 'hstore', description: 'keep hstore as is' },
      { sql: 'pg_trgm', js: 'pg_trgm', description: 'keep pg_trgm as is' },
    ]

    testCases.forEach(({ sql, js, description }) => {
      it(`should ${description}`, () => {
        expect(getPGliteJavaScriptName(sql)).toBe(js)
      })
    })
  })

  describe('isExtensionSupported', () => {
    // Test some known supported extensions
    const supportedExtensions = ['uuid-ossp', 'vector', 'hstore', 'pg_trgm']
    const unsupportedExtensions = [
      'postgis',
      'pg_stat_statements',
      'random_extension',
    ]

    supportedExtensions.forEach((extension) => {
      it(`should return true for supported extension: ${extension}`, () => {
        expect(isExtensionSupported(extension)).toBe(true)
        // Verify it's actually in the supported set
        expect(PGLITE_SUPPORTED_EXTENSIONS.has(extension)).toBe(true)
      })
    })

    unsupportedExtensions.forEach((extension) => {
      it(`should return false for unsupported extension: ${extension}`, () => {
        expect(isExtensionSupported(extension)).toBe(false)
        expect(PGLITE_SUPPORTED_EXTENSIONS.has(extension)).toBe(false)
      })
    })
  })

  describe('getExtensionConfiguration', () => {
    const singleExtensionTestCases = [
      {
        sql: 'uuid-ossp',
        js: 'uuid_ossp',
        description: 'uuid-ossp extension with name mapping',
      },
      {
        sql: 'vector',
        js: 'vector',
        description: 'vector extension without name mapping',
      },
      {
        sql: 'hstore',
        js: 'hstore',
        description: 'hstore extension without name mapping',
      },
    ]

    singleExtensionTestCases.forEach(({ sql, js, description }) => {
      it(`should generate configuration for ${description}`, () => {
        const config = getExtensionConfiguration([sql])

        expect(config.imports[js]).toBe(
          `import { ${js} } from '@electric-sql/pglite/contrib/${js}'`,
        )
        expect(config.config[js]).toBe(js)
        expect(config.unsupported).toEqual([])
      })
    })

    it('should handle multiple extensions', () => {
      const config = getExtensionConfiguration([
        'uuid-ossp',
        'hstore',
        'pg_trgm',
      ])

      expect(Object.keys(config.imports)).toEqual([
        'uuid_ossp',
        'hstore',
        'pg_trgm',
      ])
      expect(Object.keys(config.config)).toEqual([
        'uuid_ossp',
        'hstore',
        'pg_trgm',
      ])
      expect(config.unsupported).toEqual([])
    })

    it('should separate unsupported extensions', () => {
      const config = getExtensionConfiguration([
        'uuid-ossp',
        'postgis',
        'hstore',
      ])

      expect(Object.keys(config.imports)).toEqual(['uuid_ossp', 'hstore'])
      expect(Object.keys(config.config)).toEqual(['uuid_ossp', 'hstore'])
      expect(config.unsupported).toEqual(['postgis'])
    })
  })
})
