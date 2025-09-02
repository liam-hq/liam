import { describe, expect, it } from 'vitest'
import { generateCreateExtensionStatement } from './utils.js'

describe('generateCreateExtensionStatement', () => {
  it('should generate CREATE EXTENSION statement with quotes for hyphenated names', () => {
    const extension = { name: 'uuid-ossp' }
    const result = generateCreateExtensionStatement(extension)

    expect(result).toBe('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
  })

  it('should generate CREATE EXTENSION statement without quotes for simple names', () => {
    const extension = { name: 'vector' }
    const result = generateCreateExtensionStatement(extension)

    expect(result).toBe('CREATE EXTENSION IF NOT EXISTS vector;')
  })

  it('should quote extension names with uppercase letters', () => {
    const extension = { name: 'PostGIS' }
    const result = generateCreateExtensionStatement(extension)

    expect(result).toBe('CREATE EXTENSION IF NOT EXISTS "PostGIS";')
  })

  it('should preserve exact extension name without normalization', () => {
    const extension = { name: 'UUID-OSSP' }
    const result = generateCreateExtensionStatement(extension)

    expect(result).toBe('CREATE EXTENSION IF NOT EXISTS "UUID-OSSP";')
  })

  it('should handle extension names with underscores', () => {
    const extension = { name: 'pg_trgm' }
    const result = generateCreateExtensionStatement(extension)

    expect(result).toBe('CREATE EXTENSION IF NOT EXISTS pg_trgm;')
  })

  it('should handle mixed case with underscores', () => {
    const extension = { name: 'PG_TRGM' }
    const result = generateCreateExtensionStatement(extension)

    expect(result).toBe('CREATE EXTENSION IF NOT EXISTS "PG_TRGM";')
  })

  describe('various extension names', () => {
    const extensionTestCases = [
      {
        name: 'uuid-ossp',
        expected: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
      },
      {
        name: 'pgcrypto',
        expected: 'CREATE EXTENSION IF NOT EXISTS pgcrypto;',
      },
      { name: 'plpgsql', expected: 'CREATE EXTENSION IF NOT EXISTS plpgsql;' },
      { name: 'vector', expected: 'CREATE EXTENSION IF NOT EXISTS vector;' },
      { name: 'pg_trgm', expected: 'CREATE EXTENSION IF NOT EXISTS pg_trgm;' },
      {
        name: 'PostGIS',
        expected: 'CREATE EXTENSION IF NOT EXISTS "PostGIS";',
      },
      {
        name: 'my-extension',
        expected: 'CREATE EXTENSION IF NOT EXISTS "my-extension";',
      },
      {
        name: 'MyExtension',
        expected: 'CREATE EXTENSION IF NOT EXISTS "MyExtension";',
      },
      // Edge cases: names starting with digits
      {
        name: '3d_extension',
        expected: 'CREATE EXTENSION IF NOT EXISTS "3d_extension";',
      },
      // Edge cases: names with internal double quotes
      {
        name: 'my"special"extension',
        expected: 'CREATE EXTENSION IF NOT EXISTS "my""special""extension";',
      },
      // Edge cases: names with special characters
      {
        name: 'ext$name',
        expected: 'CREATE EXTENSION IF NOT EXISTS "ext$name";',
      },
      // Simple lowercase-only names should not be quoted
      {
        name: 'simple_name',
        expected: 'CREATE EXTENSION IF NOT EXISTS simple_name;',
      },
      {
        name: '_underscore_start',
        expected: 'CREATE EXTENSION IF NOT EXISTS _underscore_start;',
      },
    ]

    it.each(extensionTestCases)(
      'should generate correct DDL for $name',
      ({ name, expected }) => {
        const extension = { name }
        const result = generateCreateExtensionStatement(extension)

        expect(result).toBe(expected)
      },
    )
  })
})
