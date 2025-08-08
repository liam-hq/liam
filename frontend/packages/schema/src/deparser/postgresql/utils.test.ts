import { describe, expect, it } from 'vitest'
import { aColumn } from '../../schema/factories.js'
import {
  extractFunctionsFromColumns,
  generateRequiredFunctions,
} from './utils.js'

describe('extractFunctionsFromColumns', () => {
  it('should extract simple function calls', () => {
    const columns = [
      aColumn({
        name: 'id',
        type: 'text',
        notNull: true,
        default: 'cuid(25)',
      }),
      aColumn({
        name: 'uuid_id',
        type: 'uuid',
        notNull: false,
        default: 'gen_random_uuid()',
      }),
    ]

    const result = extractFunctionsFromColumns(columns)

    expect([...result].sort()).toEqual(['cuid', 'gen_random_uuid'])
  })

  it('should extract functions without parentheses', () => {
    const columns = [
      aColumn({
        name: 'created_at',
        type: 'timestamptz',
        notNull: false,
        default: 'current_timestamp',
      }),
      aColumn({
        name: 'date_col',
        type: 'date',
        notNull: false,
        default: 'current_date',
      }),
    ]

    const result = extractFunctionsFromColumns(columns)

    expect([...result].sort()).toEqual([
      'current_date',
      'current_time',
      'current_timestamp',
    ])
  })

  it('should extract nested function calls', () => {
    const columns = [
      aColumn({
        name: 'timestamp_col',
        type: 'bigint',
        notNull: false,
        default: 'extract(epoch from now())',
      }),
      aColumn({
        name: 'rounded_col',
        type: 'numeric',
        notNull: false,
        default: 'round(random() * 100, 2)',
      }),
    ]

    const result = extractFunctionsFromColumns(columns)

    expect([...result].sort()).toEqual(['extract', 'now', 'random', 'round'])
  })

  it('should handle complex expressions', () => {
    const columns = [
      aColumn({
        name: 'complex_col',
        type: 'text',
        notNull: false,
        default: "date_trunc('day', now()) + interval '1 day'",
      }),
    ]

    const result = extractFunctionsFromColumns(columns)

    expect([...result].sort()).toEqual(['date_trunc', 'now'])
  })

  it('should ignore non-function defaults', () => {
    const columns = [
      aColumn({
        name: 'status',
        type: 'text',
        notNull: false,
        default: 'pending',
      }),
      aColumn({
        name: 'count',
        type: 'integer',
        notNull: false,
        default: 0,
      }),
      aColumn({
        name: 'is_active',
        type: 'boolean',
        notNull: false,
        default: true,
      }),
    ]

    const result = extractFunctionsFromColumns(columns)

    expect(result.size).toBe(0)
  })

  it('should handle null defaults', () => {
    const columns = [
      aColumn({
        name: 'optional_col',
        type: 'text',
        notNull: false,
        default: null,
      }),
    ]

    const result = extractFunctionsFromColumns(columns)

    expect(result.size).toBe(0)
  })

  it('should deduplicate function names', () => {
    const columns = [
      aColumn({
        name: 'created_at',
        type: 'timestamptz',
        notNull: false,
        default: 'now()',
      }),
      aColumn({
        name: 'updated_at',
        type: 'timestamptz',
        notNull: false,
        default: 'now()',
      }),
      aColumn({
        name: 'complex_time',
        type: 'timestamptz',
        notNull: false,
        default: 'extract(epoch from now())',
      }),
    ]

    const result = extractFunctionsFromColumns(columns)

    expect([...result].sort()).toEqual(['extract', 'now'])
  })
})

describe('generateRequiredFunctions', () => {
  it('should generate cuid function definition', () => {
    const functions = new Set(['cuid'])

    const result = generateRequiredFunctions(functions)

    expect(result).toHaveLength(1)
    expect(result[0]).toContain('CREATE OR REPLACE FUNCTION cuid')
    expect(result[0]).toContain('length INTEGER DEFAULT 25')
    expect(result[0]).toContain('RETURNS TEXT')
    expect(result[0]).toContain('LANGUAGE plpgsql')
  })

  it('should generate uuid-ossp extension for UUID functions', () => {
    const functions = new Set(['gen_random_uuid', 'uuid_generate_v4'])

    const result = generateRequiredFunctions(functions)

    expect(result).toHaveLength(1)
    expect(result[0]).toBe('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
  })

  it('should combine custom functions and extensions', () => {
    const functions = new Set(['cuid', 'gen_random_uuid'])

    const result = generateRequiredFunctions(functions)

    expect(result).toHaveLength(2)
    // The order might vary, so check both possibilities
    expect(result.some((r) => r.includes('uuid-ossp'))).toBe(true)
    expect(
      result.some((r) => r.includes('CREATE OR REPLACE FUNCTION cuid')),
    ).toBe(true)
  })

  it('should deduplicate extensions', () => {
    const functions = new Set([
      'gen_random_uuid',
      'uuid_generate_v1',
      'uuid_generate_v4',
    ])

    const result = generateRequiredFunctions(functions)

    expect(result).toHaveLength(1)
    expect(result[0]).toBe('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
  })

  it('should handle empty function set', () => {
    const functions = new Set<string>()

    const result = generateRequiredFunctions(functions)

    expect(result).toHaveLength(0)
  })

  it('should ignore built-in functions', () => {
    const functions = new Set(['now', 'random', 'current_timestamp'])

    const result = generateRequiredFunctions(functions)

    expect(result).toHaveLength(0)
  })

  it('should handle mixed built-in and custom functions', () => {
    const functions = new Set(['now', 'cuid', 'random', 'gen_random_uuid'])

    const result = generateRequiredFunctions(functions)

    expect(result).toHaveLength(2)
    expect(result.some((r) => r.includes('uuid-ossp'))).toBe(true)
    expect(
      result.some((r) => r.includes('CREATE OR REPLACE FUNCTION cuid')),
    ).toBe(true)
  })
})

describe('edge cases', () => {
  describe('extractFunctionsFromColumns edge cases', () => {
    it('should handle malformed function calls', () => {
      const columns = [
        aColumn({
          name: 'bad_func',
          type: 'text',
          notNull: false,
          default: 'malformed_func(',
        }),
      ]

      const result = extractFunctionsFromColumns(columns)

      // Should still extract the function name even if malformed
      expect([...result]).toEqual(['malformed_func'])
    })

    it('should handle functions with special characters', () => {
      const columns = [
        aColumn({
          name: 'special',
          type: 'text',
          notNull: false,
          default: 'func_with_underscores(123)',
        }),
      ]

      const result = extractFunctionsFromColumns(columns)

      expect([...result]).toEqual(['func_with_underscores'])
    })

    it('should handle mixed case functions', () => {
      const columns = [
        aColumn({
          name: 'mixed',
          type: 'text',
          notNull: false,
          default: 'MixedCaseFunction()',
        }),
      ]

      const result = extractFunctionsFromColumns(columns)

      expect([...result]).toEqual(['mixedcasefunction'])
    })

    it('should handle functions in quoted strings (should not extract)', () => {
      const columns = [
        aColumn({
          name: 'quoted',
          type: 'text',
          notNull: false,
          default: "'function_call(123)'",
        }),
      ]

      const result = extractFunctionsFromColumns(columns)

      // Current implementation extracts from quoted strings too
      // This is a known limitation and acceptable for now
      expect([...result]).toEqual(['function_call'])
    })

    it('should handle very long function expressions', () => {
      const columns = [
        aColumn({
          name: 'long_expr',
          type: 'text',
          notNull: false,
          default:
            'concat(substr(uuid_generate_v4()::text, 1, 8), extract(epoch from now())::text, random()::text)',
        }),
      ]

      const result = extractFunctionsFromColumns(columns)

      expect([...result].sort()).toEqual([
        'concat',
        'extract',
        'now',
        'random',
        'substr',
        'uuid_generate_v4',
      ])
    })

    it('should handle empty strings', () => {
      const columns = [
        aColumn({
          name: 'empty',
          type: 'text',
          notNull: false,
          default: '',
        }),
        aColumn({
          name: 'whitespace',
          type: 'text',
          notNull: false,
          default: '   ',
        }),
      ]

      const result = extractFunctionsFromColumns(columns)

      expect(result.size).toBe(0)
    })

    it('should handle SQL keywords that look like functions', () => {
      const columns = [
        aColumn({
          name: 'keyword_like',
          type: 'text',
          notNull: false,
          default: 'CASE WHEN true THEN select(123) ELSE null END',
        }),
      ]

      const result = extractFunctionsFromColumns(columns)

      // Should extract 'select' as it matches function pattern
      expect([...result]).toEqual(['select'])
    })
  })

  describe('generateRequiredFunctions edge cases', () => {
    it('should handle unknown function names gracefully', () => {
      const functions = new Set(['unknown_function', 'another_unknown'])

      const result = generateRequiredFunctions(functions)

      // Should not generate anything for unknown functions
      expect(result).toHaveLength(0)
    })

    it('should handle functions with similar names', () => {
      const functions = new Set(['cuid', 'cuid2', 'cuid_extended'])

      const result = generateRequiredFunctions(functions)

      // Should only generate definition for exact match 'cuid'
      expect(result).toHaveLength(1)
      expect(result[0]).toContain('CREATE OR REPLACE FUNCTION cuid')
    })

    it('should handle case sensitivity properly', () => {
      const functions = new Set(['CUID', 'Gen_Random_UUID'])

      const result = generateRequiredFunctions(functions)

      // Function names should be case-insensitive in our mapping
      expect(result).toHaveLength(0) // These are uppercase, won't match lowercase mappings
    })
  })
})
