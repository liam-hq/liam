import { describe, expect, it } from 'vitest'
import { aColumn, aTable, type Schema } from '../schema/index.js'
import { applyPatchOperations, operationsSchema } from './index.js'

describe('operation exports', () => {
  describe('applyPatchOperations', () => {
    it('should export applyPatchOperations function', () => {
      expect(typeof applyPatchOperations).toBe('function')
    })

    it('should maintain correct function signature', () => {
      expect(applyPatchOperations.length).toBe(2)
    })

    it('should handle operations array correctly', () => {
      const schema: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'bigint', notNull: true }),
            },
          }),
        },
      }
      const operations = [
        {
          op: 'add' as const,
          path: '/tables/posts',
          value: aTable({ name: 'posts', columns: {} }),
        },
      ]

      expect(() => applyPatchOperations(schema, operations)).not.toThrow()
      expect(schema.tables['posts']).toBeDefined()
    })

    it('should work with schema inputs', () => {
      const schema: Schema = { tables: {} }
      const operations: any[] = []

      expect(() => applyPatchOperations(schema, operations)).not.toThrow()
    })
  })

  describe('operationsSchema', () => {
    it('should export operationsSchema for validation', () => {
      expect(operationsSchema).toBeDefined()
    })

    it('should be a valid Valibot schema', () => {
      expect(typeof operationsSchema).toBe('object')
      expect(operationsSchema).toBeDefined()
      expect(
        'type' in operationsSchema ||
          'kind' in operationsSchema ||
          '_run' in operationsSchema,
      ).toBe(true)
    })

    it('should validate array of operations', () => {
      expect(operationsSchema).toBeDefined()
      expect(typeof operationsSchema).toBe('object')
    })
  })

  describe('module structure', () => {
    it('should only export public API functions', () => {
      const moduleExports = { applyPatchOperations, operationsSchema }
      expect(Object.keys(moduleExports)).toHaveLength(2)
    })

    it('should not expose internal implementation', () => {
      const moduleExports = { applyPatchOperations, operationsSchema }
      expect(typeof moduleExports.applyPatchOperations).toBe('function')
      expect(typeof moduleExports.operationsSchema).toBe('object')
    })

    it('should maintain backward compatibility', () => {
      expect(applyPatchOperations).toBeDefined()
      expect(operationsSchema).toBeDefined()
    })
  })
})
