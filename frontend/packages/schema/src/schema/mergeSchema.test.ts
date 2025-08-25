import { describe, expect, it } from 'vitest'
import { mergeSchemas } from './mergeSchema.js'
import type { Column, Schema, Table } from './schema.js'

describe('mergeSchemas', () => {
  const createColumn = (overrides: Partial<Column> = {}): Column => ({
    name: 'id',
    type: 'integer',
    default: null,
    check: null,
    notNull: true,
    comment: null,
    ...overrides,
  })

  const createTable = (overrides: Partial<Table> = {}): Table => ({
    name: 'users',
    columns: {
      id: createColumn({ name: 'id' }),
    },
    comment: null,
    indexes: {},
    constraints: {
      users_pkey: {
        type: 'PRIMARY KEY',
        name: 'users_pkey',
        columnNames: ['id'],
      },
    },
    ...overrides,
  })

  const createSchema = (overrides: Partial<Schema> = {}): Schema => ({
    tables: {},
    enums: {},
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
              id: createColumn({ name: 'id' }),
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
              id: createColumn({ name: 'id' }),
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

  describe('edge cases', () => {
    it('should handle empty schemas', () => {
      const beforeSchema = createSchema()
      const afterSchema = createSchema()

      const result = mergeSchemas(beforeSchema, afterSchema)

      expect(result.tables).toEqual({})
    })

    it('should handle schema with only before data', () => {
      const beforeSchema = createSchema({
        tables: {
          users: createTable({ name: 'users' }),
        },
      })

      const afterSchema = createSchema()

      const result = mergeSchemas(beforeSchema, afterSchema)

      expect(result.tables).toHaveProperty('users')
    })

    it('should handle schema with only after data', () => {
      const beforeSchema = createSchema()

      const afterSchema = createSchema({
        tables: {
          users: createTable({ name: 'users' }),
        },
      })

      const result = mergeSchemas(beforeSchema, afterSchema)

      expect(result.tables).toHaveProperty('users')
    })
  })

  describe('indexes merging', () => {
    it('should keep removed indexes from before schema', () => {
      const beforeSchema = createSchema({
        tables: {
          users: createTable({
            name: 'users',
            indexes: {
              users_email_idx: {
                name: 'users_email_idx',
                unique: true,
                columns: ['email'],
                type: 'btree',
              },
              users_name_idx: {
                name: 'users_name_idx',
                unique: false,
                columns: ['name'],
                type: 'btree',
              },
            },
          }),
        },
      })

      const afterSchema = createSchema({
        tables: {
          users: createTable({
            name: 'users',
            indexes: {
              users_name_idx: {
                name: 'users_name_idx',
                unique: false,
                columns: ['name'],
                type: 'btree',
              },
              // users_email_idx is removed
            },
          }),
        },
      })

      const result = mergeSchemas(beforeSchema, afterSchema)

      expect(result.tables['users']?.indexes).toHaveProperty('users_name_idx')
      expect(result.tables['users']?.indexes).toHaveProperty('users_email_idx') // Should still exist from before
    })
  })

  describe('constraints merging', () => {
    it('should keep removed constraints from before schema', () => {
      const beforeSchema = createSchema({
        tables: {
          users: createTable({
            name: 'users',
            constraints: {
              users_pkey: {
                type: 'PRIMARY KEY',
                name: 'users_pkey',
                columnNames: ['id'],
              },
              users_email_unique: {
                type: 'UNIQUE',
                name: 'users_email_unique',
                columnNames: ['email'],
              },
              users_age_check: {
                type: 'CHECK',
                name: 'users_age_check',
                detail: 'age > 0',
              },
            },
          }),
        },
      })

      const afterSchema = createSchema({
        tables: {
          users: createTable({
            name: 'users',
            constraints: {
              users_pkey: {
                type: 'PRIMARY KEY',
                name: 'users_pkey',
                columnNames: ['id'],
              },
              // users_email_unique and users_age_check are removed
            },
          }),
        },
      })

      const result = mergeSchemas(beforeSchema, afterSchema)

      expect(result.tables['users']?.constraints).toHaveProperty('users_pkey')
      expect(result.tables['users']?.constraints).toHaveProperty(
        'users_email_unique',
      ) // Should still exist from before
      expect(result.tables['users']?.constraints).toHaveProperty(
        'users_age_check',
      ) // Should still exist from before
    })
  })

  describe('complex merge scenarios', () => {
    it('should handle complex column changes', () => {
      const beforeSchema = createSchema({
        tables: {
          users: createTable({
            name: 'users',
            columns: {
              id: createColumn({ name: 'id' }),
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
              id: createColumn({ name: 'id' }),
              full_name: createColumn({ name: 'full_name', type: 'string' }), // renamed from name
              email: createColumn({
                name: 'email',
                type: 'text',
              }), // type changed from string to text
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
      expect(userColumns?.['email']?.type).toBe('text') // Should use after schema properties
    })
  })
})
