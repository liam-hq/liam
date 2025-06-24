import { describe, expect, it } from 'vitest'
import { mergeSchemas } from './mergeSchema.js'
import type { Column, Relationship, Schema, Table } from './schema.js'

describe('mergeSchemas', () => {
  const createColumn = (overrides: Partial<Column> = {}): Column => ({
    name: 'id',
    type: 'integer',
    default: null,
    check: null,
    primary: false,
    unique: false,
    notNull: true,
    comment: null,
    ...overrides,
  })

  const createTable = (overrides: Partial<Table> = {}): Table => ({
    name: 'users',
    columns: {
      id: createColumn({ name: 'id', primary: true }),
    },
    comment: null,
    indexes: {},
    constraints: {},
    ...overrides,
  })

  const createRelationship = (
    overrides: Partial<Relationship> = {},
  ): Relationship => ({
    name: 'users_posts',
    primaryTableName: 'users',
    primaryColumnName: 'id',
    foreignTableName: 'posts',
    foreignColumnName: 'user_id',
    cardinality: 'ONE_TO_MANY',
    updateConstraint: 'CASCADE',
    deleteConstraint: 'CASCADE',
    ...overrides,
  })

  const createSchema = (overrides: Partial<Schema> = {}): Schema => ({
    tables: {},
    relationships: {},
    ...overrides,
  })

  describe('table merging', () => {
    it('should merge tables from both schemas', () => {
      const beforeSchema = createSchema({
        tables: {
          users: createTable({ name: 'users' }),
        },
      })

      const afterSchema = createSchema({
        tables: {
          posts: createTable({ name: 'posts' }),
        },
      })

      const result = mergeSchemas(beforeSchema, afterSchema)

      expect(result.tables).toHaveProperty('users')
      expect(result.tables).toHaveProperty('posts')
    })

    it('should keep removed columns from before schema', () => {
      const beforeSchema = createSchema({
        tables: {
          users: createTable({
            name: 'users',
            columns: {
              id: createColumn({ name: 'id', primary: true }),
              name: createColumn({ name: 'name', type: 'string' }),
              email: createColumn({ name: 'email', type: 'string' }),
            },
          }),
        },
      })

      const afterSchema = createSchema({
        tables: {
          users: createTable({
            name: 'users',
            columns: {
              id: createColumn({ name: 'id', primary: true }),
              name: createColumn({ name: 'name', type: 'string' }),
              // email column is removed
            },
          }),
        },
      })

      const result = mergeSchemas(beforeSchema, afterSchema)

      expect(result.tables['users']?.columns).toHaveProperty('id')
      expect(result.tables['users']?.columns).toHaveProperty('name')
      expect(result.tables['users']?.columns).toHaveProperty('email') // Should still exist from before
    })

    it('should preserve tables that only exist in before schema', () => {
      const beforeSchema = createSchema({
        tables: {
          users: createTable({ name: 'users' }),
          legacy_table: createTable({ name: 'legacy_table' }),
        },
      })

      const afterSchema = createSchema({
        tables: {
          users: createTable({ name: 'users' }),
          // legacy_table is not in after schema
        },
      })

      const result = mergeSchemas(beforeSchema, afterSchema)

      expect(result.tables).toHaveProperty('users')
      expect(result.tables).toHaveProperty('legacy_table')
    })

    it('should use after schema table properties when both exist', () => {
      const beforeSchema = createSchema({
        tables: {
          users: createTable({
            name: 'users',
            comment: 'Old comment',
          }),
        },
      })

      const afterSchema = createSchema({
        tables: {
          users: createTable({
            name: 'users',
            comment: 'New comment',
          }),
        },
      })

      const result = mergeSchemas(beforeSchema, afterSchema)

      expect(result.tables['users']?.comment).toBe('New comment')
    })
  })

  describe('relationship merging', () => {
    it('should use relationships from after schema only', () => {
      const beforeSchema = createSchema({
        relationships: {
          old_rel: createRelationship({ name: 'old_rel' }),
          updated_rel: createRelationship({
            name: 'updated_rel',
            cardinality: 'ONE_TO_ONE',
          }),
        },
      })

      const afterSchema = createSchema({
        relationships: {
          updated_rel: createRelationship({
            name: 'updated_rel',
            cardinality: 'ONE_TO_MANY',
          }),
          new_rel: createRelationship({ name: 'new_rel' }),
        },
      })

      const result = mergeSchemas(beforeSchema, afterSchema)

      expect(result.relationships).not.toHaveProperty('old_rel')
      expect(result.relationships).toHaveProperty('updated_rel')
      expect(result.relationships).toHaveProperty('new_rel')
      expect(result.relationships['updated_rel']?.cardinality).toBe(
        'ONE_TO_MANY',
      )
    })

    it('should handle empty relationships', () => {
      const beforeSchema = createSchema({
        relationships: {
          rel1: createRelationship({ name: 'rel1' }),
        },
      })

      const afterSchema = createSchema({
        relationships: {},
      })

      const result = mergeSchemas(beforeSchema, afterSchema)

      expect(Object.keys(result.relationships)).toHaveLength(0)
    })
  })

  describe('edge cases', () => {
    it('should handle empty schemas', () => {
      const beforeSchema = createSchema()
      const afterSchema = createSchema()

      const result = mergeSchemas(beforeSchema, afterSchema)

      expect(result.tables).toEqual({})
      expect(result.relationships).toEqual({})
    })

    it('should handle schema with only before data', () => {
      const beforeSchema = createSchema({
        tables: {
          users: createTable({ name: 'users' }),
        },
        relationships: {
          rel1: createRelationship({ name: 'rel1' }),
        },
      })

      const afterSchema = createSchema()

      const result = mergeSchemas(beforeSchema, afterSchema)

      expect(result.tables).toHaveProperty('users')
      expect(result.relationships).toEqual({}) // Relationships come from after only
    })

    it('should handle schema with only after data', () => {
      const beforeSchema = createSchema()

      const afterSchema = createSchema({
        tables: {
          users: createTable({ name: 'users' }),
        },
        relationships: {
          rel1: createRelationship({ name: 'rel1' }),
        },
      })

      const result = mergeSchemas(beforeSchema, afterSchema)

      expect(result.tables).toHaveProperty('users')
      expect(result.relationships).toHaveProperty('rel1')
    })
  })

  describe('complex merge scenarios', () => {
    it('should handle complex column changes', () => {
      const beforeSchema = createSchema({
        tables: {
          users: createTable({
            name: 'users',
            columns: {
              id: createColumn({ name: 'id', primary: true }),
              name: createColumn({ name: 'name', type: 'string' }),
              email: createColumn({ name: 'email', type: 'string' }),
              created_at: createColumn({
                name: 'created_at',
                type: 'timestamp',
              }),
            },
          }),
        },
      })

      const afterSchema = createSchema({
        tables: {
          users: createTable({
            name: 'users',
            columns: {
              id: createColumn({ name: 'id', primary: true }),
              full_name: createColumn({ name: 'full_name', type: 'string' }), // renamed from name
              email: createColumn({
                name: 'email',
                type: 'string',
                unique: true,
              }), // added unique
              updated_at: createColumn({
                name: 'updated_at',
                type: 'timestamp',
              }), // new column
              // created_at removed
            },
          }),
        },
      })

      const result = mergeSchemas(beforeSchema, afterSchema)

      const userColumns = result.tables['users']?.columns
      expect(userColumns).toHaveProperty('id')
      expect(userColumns).toHaveProperty('full_name')
      expect(userColumns).toHaveProperty('email')
      expect(userColumns).toHaveProperty('updated_at')
      expect(userColumns).toHaveProperty('created_at') // Should be preserved from before
      expect(userColumns).toHaveProperty('name') // Should be preserved as removed column from before
      expect(userColumns?.['email']?.unique).toBe(true) // Should use after schema properties
    })
  })
})
