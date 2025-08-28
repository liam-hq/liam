import { PGLITE_SUPPORTED_EXTENSIONS } from '@liam-hq/schema'
import { describe, expect, it } from 'vitest'
import {
  detectExtensionsFromSQL,
  getExtensionConfiguration,
  getJavaScriptName,
  isExtensionSupported,
} from './extensions'

describe('PGlite Extension Utilities', () => {
  describe('detectExtensionsFromSQL', () => {
    it('should detect CREATE EXTENSION statements', () => {
      const sql = `
        CREATE EXTENSION "uuid-ossp";
        CREATE TABLE users (id uuid);
      `
      const extensions = detectExtensionsFromSQL(sql)
      expect(extensions).toEqual(['uuid-ossp'])
    })

    it('should detect CREATE EXTENSION IF NOT EXISTS statements', () => {
      const sql = `CREATE EXTENSION IF NOT EXISTS "vector";`
      const extensions = detectExtensionsFromSQL(sql)
      expect(extensions).toEqual(['vector'])
    })

    it('should detect multiple extensions', () => {
      const sql = `
        CREATE EXTENSION "uuid-ossp";
        CREATE EXTENSION IF NOT EXISTS "hstore";
        CREATE EXTENSION "pg_trgm";
      `
      const extensions = detectExtensionsFromSQL(sql)
      expect(extensions).toEqual(['uuid-ossp', 'hstore', 'pg_trgm'])
    })

    it('should detect extensions without quotes', () => {
      const sql = 'CREATE EXTENSION vector;'
      const extensions = detectExtensionsFromSQL(sql)
      expect(extensions).toEqual(['vector'])
    })

    it('should handle extensions with underscores', () => {
      const sql = 'CREATE EXTENSION tsm_system_rows;'
      const extensions = detectExtensionsFromSQL(sql)
      expect(extensions).toEqual(['tsm_system_rows'])
    })

    it('should filter out unsupported extensions', () => {
      const sql = `
        CREATE EXTENSION "uuid-ossp";
        CREATE EXTENSION "postgis";  -- Not supported
        CREATE EXTENSION "hstore";
      `
      const extensions = detectExtensionsFromSQL(sql)
      expect(extensions).toEqual(['uuid-ossp', 'hstore'])
    })

    it('should return empty array when no extensions found', () => {
      const sql = 'CREATE TABLE users (id integer);'
      const extensions = detectExtensionsFromSQL(sql)
      expect(extensions).toEqual([])
    })
  })

  describe('getJavaScriptName', () => {
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
        expect(getJavaScriptName(sql)).toBe(js)
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
