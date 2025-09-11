import { describe, expect, it } from 'vitest'
import { applyOpenAISchemaRequirements } from './applyOpenAiSchemaRequirements'

describe('applyOpenAISchemaRequirements', () => {
  describe('basic type handling', () => {
    it('should return null for null input', () => {
      expect(applyOpenAISchemaRequirements(null)).toBeNull()
    })

    it('should return undefined for undefined input', () => {
      expect(applyOpenAISchemaRequirements(undefined)).toBeUndefined()
    })

    it('should return non-object values as-is', () => {
      expect(applyOpenAISchemaRequirements('string')).toBe('string')
      expect(applyOpenAISchemaRequirements(123)).toBe(123)
      expect(applyOpenAISchemaRequirements(true)).toBe(true)
    })

    it('should handle arrays recursively', () => {
      const input = [
        { type: 'object', properties: { name: { type: 'string' } } },
        { type: 'object' },
      ]
      const result = applyOpenAISchemaRequirements(input)
      expect(result).toEqual([
        {
          type: 'object',
          properties: { name: { type: 'string' } },
          additionalProperties: false,
        },
        {
          type: 'object',
          additionalProperties: false,
          properties: {},
        },
      ])
    })
  })

  describe('object schema processing', () => {
    it('should add additionalProperties: false to object schemas', () => {
      const input = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      }
      const result = applyOpenAISchemaRequirements(input)
      expect(result).toEqual({
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        additionalProperties: false,
      })
    })

    it('should not override existing additionalProperties: true', () => {
      const input = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        additionalProperties: true,
      }
      const result = applyOpenAISchemaRequirements(input)
      expect(result).toEqual({
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        additionalProperties: true,
      })
    })

    it('should add empty properties to objects with only additionalProperties', () => {
      // This is the critical fix for v.record() types
      const input = {
        type: 'object',
        additionalProperties: { type: 'string' },
      }
      const result = applyOpenAISchemaRequirements(input)
      expect(result).toEqual({
        type: 'object',
        additionalProperties: { type: 'string' },
        properties: {},
      })
    })

    it('should not add properties if already present', () => {
      const input = {
        type: 'object',
        properties: { existing: { type: 'string' } },
        additionalProperties: { type: 'number' },
      }
      const result = applyOpenAISchemaRequirements(input)
      expect(result).toEqual({
        type: 'object',
        properties: { existing: { type: 'string' } },
        additionalProperties: { type: 'number' },
      })
    })
  })

  describe('const type inference', () => {
    it('should add type for string const', () => {
      const input = { const: 'add' }
      const result = applyOpenAISchemaRequirements(input)
      expect(result).toEqual({
        const: 'add',
        type: 'string',
      })
    })

    it('should add type for number const', () => {
      const input = { const: 42 }
      const result = applyOpenAISchemaRequirements(input)
      expect(result).toEqual({
        const: 42,
        type: 'number',
      })
    })

    it('should add type for boolean const', () => {
      const input = { const: true }
      const result = applyOpenAISchemaRequirements(input)
      expect(result).toEqual({
        const: true,
        type: 'boolean',
      })
    })

    it('should add type for null const', () => {
      const input = { const: null }
      const result = applyOpenAISchemaRequirements(input)
      expect(result).toEqual({
        const: null,
        type: 'null',
      })
    })

    it('should add type for array const', () => {
      const input = { const: [1, 2, 3] }
      const result = applyOpenAISchemaRequirements(input)
      expect(result).toEqual({
        const: [1, 2, 3],
        type: 'array',
      })
    })

    it('should add type for object const', () => {
      const input = { const: { key: 'value' } }
      const result = applyOpenAISchemaRequirements(input)
      expect(result).toEqual({
        const: { key: 'value' },
        type: 'object',
      })
    })

    it('should not override existing type for const', () => {
      const input = { const: 'test', type: 'string' }
      const result = applyOpenAISchemaRequirements(input)
      expect(result).toEqual({
        const: 'test',
        type: 'string',
      })
    })
  })

  describe('enum type inference', () => {
    it('should NOT add type for string enum (not required by OpenAI)', () => {
      const input = { enum: ['red', 'green', 'blue'] }
      const result = applyOpenAISchemaRequirements(input)
      expect(result).toEqual({
        enum: ['red', 'green', 'blue'],
        // No type added - enum doesn't require it
      })
    })

    it('should NOT add type for number enum', () => {
      const input = { enum: [1, 2, 3] }
      const result = applyOpenAISchemaRequirements(input)
      expect(result).toEqual({
        enum: [1, 2, 3],
        // No type added
      })
    })

    it('should NOT add type for boolean enum', () => {
      const input = { enum: [true, false] }
      const result = applyOpenAISchemaRequirements(input)
      expect(result).toEqual({
        enum: [true, false],
        // No type added
      })
    })

    it('should NOT add type for null enum', () => {
      const input = { enum: [null] }
      const result = applyOpenAISchemaRequirements(input)
      expect(result).toEqual({
        enum: [null],
        // No type added
      })
    })

    it('should not add type for empty enum', () => {
      const input = { enum: [] }
      const result = applyOpenAISchemaRequirements(input)
      expect(result).toEqual({
        enum: [],
      })
    })

    it('should preserve existing type for enum if provided', () => {
      const input = { enum: ['a', 'b'], type: 'string' }
      const result = applyOpenAISchemaRequirements(input)
      expect(result).toEqual({
        enum: ['a', 'b'],
        type: 'string', // Preserved, not removed
      })
    })
  })

  describe('nested schema processing', () => {
    it('should process nested objects recursively', () => {
      const input = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { const: 'admin' },
            },
          },
          status: { enum: ['active', 'inactive'] },
        },
      }
      const result = applyOpenAISchemaRequirements(input)
      expect(result).toEqual({
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { const: 'admin', type: 'string' }, // const gets type
            },
            additionalProperties: false,
          },
          status: { enum: ['active', 'inactive'] }, // enum doesn't get type
        },
        additionalProperties: false,
      })
    })

    it('should handle anyOf with const values', () => {
      // This is the actual case from the error log
      const input = {
        anyOf: [
          {
            type: 'object',
            properties: {
              op: { const: 'add' },
              path: { type: 'string' },
              value: { type: 'object' },
            },
          },
          {
            type: 'object',
            properties: {
              op: { const: 'remove' },
              path: { type: 'string' },
            },
          },
        ],
      }
      const result = applyOpenAISchemaRequirements(input)
      expect(result).toEqual({
        anyOf: [
          {
            type: 'object',
            properties: {
              op: { const: 'add', type: 'string' },
              path: { type: 'string' },
              value: {
                type: 'object',
                additionalProperties: false,
                properties: {},
              },
            },
            additionalProperties: false,
          },
          {
            type: 'object',
            properties: {
              op: { const: 'remove', type: 'string' },
              path: { type: 'string' },
            },
            additionalProperties: false,
          },
        ],
      })
    })

    it('should handle complex valibot record-like schema', () => {
      // Simulates v.record() output
      const input = {
        type: 'object',
        properties: {
          tables: {
            type: 'object',
            additionalProperties: {
              type: 'object',
              properties: {
                columns: {
                  type: 'object',
                  additionalProperties: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      type: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      }
      const result = applyOpenAISchemaRequirements(input)
      expect(result).toEqual({
        type: 'object',
        properties: {
          tables: {
            type: 'object',
            additionalProperties: {
              type: 'object',
              properties: {
                columns: {
                  type: 'object',
                  additionalProperties: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      type: { type: 'string' },
                    },
                    additionalProperties: false,
                  },
                  properties: {}, // Critical fix: added empty properties
                },
              },
              additionalProperties: false,
            },
            properties: {}, // Critical fix: added empty properties
          },
        },
        additionalProperties: false,
      })
    })
  })

  describe('edge cases', () => {
    it('should handle schemas without type field', () => {
      const input = {
        properties: {
          name: { type: 'string' },
        },
      }
      const result = applyOpenAISchemaRequirements(input)
      expect(result).toEqual({
        properties: {
          name: { type: 'string' },
        },
      })
    })

    it('should handle mixed const and type correctly', () => {
      const input = {
        properties: {
          a: { const: 'value', type: 'string' }, // already has type
          b: { const: 123 }, // needs type
          c: { enum: ['x', 'y'] }, // needs type
        },
      }
      const result = applyOpenAISchemaRequirements(input)
      expect(result).toEqual({
        properties: {
          a: { const: 'value', type: 'string' },
          b: { const: 123, type: 'number' },
          c: { enum: ['x', 'y'] }, // enum doesn't get type
        },
      })
    })
  })
})
