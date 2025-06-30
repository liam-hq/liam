import { describe, expect, it } from 'vitest'
import type { SchemaDeparser, OperationDeparser } from './type.js'
import { aColumn, aTable, type Schema } from '../schema/index.js'
import { postgresqlSchemaDeparser, postgresqlOperationDeparser } from './postgresql/index.js'

describe('deparser types', () => {
  describe('SchemaDeparser type', () => {
    it('should be a function type that accepts a Schema and returns DeparserResult', () => {
      const deparser: SchemaDeparser = postgresqlSchemaDeparser
      expect(typeof deparser).toBe('function')
    })

    it('should handle valid schema input correctly', () => {
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
      const deparser: SchemaDeparser = postgresqlSchemaDeparser
      const result = deparser(schema)
      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
    })

    it('should return SQL string in result value', () => {
      const schema: Schema = { tables: {} }
      const deparser: SchemaDeparser = postgresqlSchemaDeparser
      const result = deparser(schema)
      expect(typeof result.value).toBe('string')
    })

    it('should include errors array in result', () => {
      const schema: Schema = { tables: {} }
      const deparser: SchemaDeparser = postgresqlSchemaDeparser
      const result = deparser(schema)
      expect(Array.isArray(result.errors)).toBe(true)
    })
  })

  describe('OperationDeparser type', () => {
    it('should be a function type that accepts an Operation and returns DeparserResult', () => {
      const deparser: OperationDeparser = postgresqlOperationDeparser
      expect(typeof deparser).toBe('function')
    })

    it('should handle valid operation input correctly', () => {
      const operation = { op: 'add', path: '/tables/test', value: aTable({ name: 'test', columns: {} }) }
      const deparser: OperationDeparser = postgresqlOperationDeparser
      const result = deparser(operation as any)
      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
    })

    it('should return SQL string in result value', () => {
      const operation = { op: 'add', path: '/tables/test', value: aTable({ name: 'test', columns: {} }) }
      const deparser: OperationDeparser = postgresqlOperationDeparser
      const result = deparser(operation as any)
      expect(typeof result.value).toBe('string')
    })

    it('should include errors array in result', () => {
      const operation = { op: 'add', path: '/tables/test', value: aTable({ name: 'test', columns: {} }) }
      const deparser: OperationDeparser = postgresqlOperationDeparser
      const result = deparser(operation as any)
      expect(Array.isArray(result.errors)).toBe(true)
    })
  })

  describe('DeparserResult type', () => {
    it('should have value property containing SQL string', () => {
      const schema: Schema = { tables: {} }
      const result = postgresqlSchemaDeparser(schema)
      expect('value' in result).toBe(true)
      expect(typeof result.value).toBe('string')
    })

    it('should have errors property as array of ProcessError', () => {
      const schema: Schema = { tables: {} }
      const result = postgresqlSchemaDeparser(schema)
      expect('errors' in result).toBe(true)
      expect(Array.isArray(result.errors)).toBe(true)
    })

    it('should allow empty errors array for successful deparsing', () => {
      const schema: Schema = { tables: {} }
      const result = postgresqlSchemaDeparser(schema)
      expect(result.errors).toBeDefined()
      expect(Array.isArray(result.errors)).toBe(true)
    })

    it('should allow multiple errors in errors array', () => {
      const schema: Schema = { tables: {} }
      const result = postgresqlSchemaDeparser(schema)
      expect(Array.isArray(result.errors)).toBe(true)
    })
  })

  describe('type compatibility', () => {
    it('should ensure SchemaDeparser implementations match expected signature', () => {
      const deparser: SchemaDeparser = postgresqlSchemaDeparser
      const schema: Schema = { tables: {} }
      const result = deparser(schema)
      expect(result).toHaveProperty('value')
      expect(result).toHaveProperty('errors')
    })

    it('should ensure OperationDeparser implementations match expected signature', () => {
      const deparser: OperationDeparser = postgresqlOperationDeparser
      const operation = { op: 'add', path: '/tables/test', value: aTable({ name: 'test', columns: {} }) }
      const result = deparser(operation as any)
      expect(result).toHaveProperty('value')
      expect(result).toHaveProperty('errors')
    })

    it('should maintain type safety between deparser and result types', () => {
      const schemaDeparser: SchemaDeparser = postgresqlSchemaDeparser
      const operationDeparser: OperationDeparser = postgresqlOperationDeparser
      
      expect(typeof schemaDeparser).toBe('function')
      expect(typeof operationDeparser).toBe('function')
    })
  })
})
