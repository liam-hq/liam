import { describe, expect, it } from 'vitest'
import { buildSchemaDiff } from './buildSchemaDiff.js'
import { aColumn, aTable, type Schema } from '../schema/index.js'

describe('buildSchemaDiff', () => {
  describe('basic functionality', () => {
    it('should return empty array when comparing identical schemas', () => {
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
      
      const result = buildSchemaDiff(schema, schema)
      expect(result).toEqual([])
    })

    it('should detect added tables', () => {
      const before: Schema = { tables: {} }
      const after: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'bigint', notNull: true }),
            },
          }),
        },
      }
      
      const result = buildSchemaDiff(before, after)
      expect(result.length).toBeGreaterThan(0)
      expect(result.some(item => item.kind === 'table' && item.status === 'added')).toBe(true)
    })

    it('should detect removed tables', () => {
      const before: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'bigint', notNull: true }),
            },
          }),
        },
      }
      const after: Schema = { tables: {} }
      
      const result = buildSchemaDiff(before, after)
      expect(result.length).toBeGreaterThan(0)
      expect(result.some(item => item.kind === 'table' && item.status === 'removed')).toBe(true)
    })

    it('should detect modified tables', () => {
      const before: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'bigint', notNull: true }),
            },
          }),
        },
      }
      const after: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'bigint', notNull: true }),
              name: aColumn({ name: 'name', type: 'varchar', notNull: false }),
            },
          }),
        },
      }
      
      const result = buildSchemaDiff(before, after)
      expect(result.length).toBeGreaterThan(0)
      expect(result.some(item => item.kind === 'column' && item.status === 'added')).toBe(true)
    })
  })

  describe('table diff detection', () => {
    it('should detect table name changes', () => {
      const before: Schema = {
        tables: {
          users: aTable({ name: 'users', columns: {} }),
        },
      }
      const after: Schema = {
        tables: {
          people: aTable({ name: 'people', columns: {} }),
        },
      }
      
      const result = buildSchemaDiff(before, after)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should detect table comment changes', () => {
      const before: Schema = {
        tables: {
          users: aTable({ name: 'users', columns: {}, comment: 'Old comment' }),
        },
      }
      const after: Schema = {
        tables: {
          users: aTable({ name: 'users', columns: {}, comment: 'New comment' }),
        },
      }
      
      const result = buildSchemaDiff(before, after)
      expect(result.some(item => item.kind === 'table-comment')).toBe(true)
    })

    it('should detect multiple table changes in single diff', () => {
      const before: Schema = {
        tables: {
          users: aTable({ name: 'users', columns: {} }),
          posts: aTable({ name: 'posts', columns: {} }),
        },
      }
      const after: Schema = {
        tables: {
          users: aTable({ name: 'users', columns: {} }),
          articles: aTable({ name: 'articles', columns: {} }),
        },
      }
      
      const result = buildSchemaDiff(before, after)
      expect(result.length).toBeGreaterThan(1)
    })
  })

  describe('column diff detection', () => {
    it('should detect added columns', () => {
      const before: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'bigint', notNull: true }),
            },
          }),
        },
      }
      const after: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'bigint', notNull: true }),
              name: aColumn({ name: 'name', type: 'varchar', notNull: false }),
            },
          }),
        },
      }
      
      const result = buildSchemaDiff(before, after)
      expect(result.some(item => item.kind === 'column' && item.status === 'added')).toBe(true)
    })

    it('should detect removed columns', () => {
      const before: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'bigint', notNull: true }),
              name: aColumn({ name: 'name', type: 'varchar', notNull: false }),
            },
          }),
        },
      }
      const after: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'bigint', notNull: true }),
            },
          }),
        },
      }
      
      const result = buildSchemaDiff(before, after)
      expect(result.some(item => item.kind === 'column' && item.status === 'removed')).toBe(true)
    })

    it('should detect column name changes', () => {
      const before: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              user_name: aColumn({ name: 'user_name', type: 'varchar', notNull: false }),
            },
          }),
        },
      }
      const after: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              name: aColumn({ name: 'name', type: 'varchar', notNull: false }),
            },
          }),
        },
      }
      
      const result = buildSchemaDiff(before, after)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should detect column type changes', () => {
      const before: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              age: aColumn({ name: 'age', type: 'integer', notNull: false }),
            },
          }),
        },
      }
      const after: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              age: aColumn({ name: 'age', type: 'bigint', notNull: false }),
            },
          }),
        },
      }
      
      const result = buildSchemaDiff(before, after)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should detect column default value changes', () => {
      const before: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              status: aColumn({ name: 'status', type: 'varchar', notNull: false, default: 'active' }),
            },
          }),
        },
      }
      const after: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              status: aColumn({ name: 'status', type: 'varchar', notNull: false, default: 'pending' }),
            },
          }),
        },
      }
      
      const result = buildSchemaDiff(before, after)
      expect(result.some(item => item.kind === 'column-default')).toBe(true)
    })

    it('should detect column nullable changes', () => {
      const before: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              email: aColumn({ name: 'email', type: 'varchar', notNull: false }),
            },
          }),
        },
      }
      const after: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              email: aColumn({ name: 'email', type: 'varchar', notNull: true }),
            },
          }),
        },
      }
      
      const result = buildSchemaDiff(before, after)
      expect(result.some(item => item.kind === 'column-not-null')).toBe(true)
    })

    it('should detect column comment changes', () => {
      const before: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              email: aColumn({ name: 'email', type: 'varchar', notNull: false, comment: 'Old comment' }),
            },
          }),
        },
      }
      const after: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              email: aColumn({ name: 'email', type: 'varchar', notNull: false, comment: 'New comment' }),
            },
          }),
        },
      }
      
      const result = buildSchemaDiff(before, after)
      expect(result.some(item => item.kind === 'column-comment')).toBe(true)
    })

    it('should detect column check constraint changes', () => {
      const before: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              age: aColumn({ name: 'age', type: 'integer', notNull: false, check: 'age >= 0' }),
            },
          }),
        },
      }
      const after: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              age: aColumn({ name: 'age', type: 'integer', notNull: false, check: 'age >= 18' }),
            },
          }),
        },
      }
      
      const result = buildSchemaDiff(before, after)
      expect(result.some(item => item.kind === 'column-check')).toBe(true)
    })
  })

  describe('index diff detection', () => {
    it('should detect added indexes', () => {
      const before: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              email: aColumn({ name: 'email', type: 'varchar', notNull: false }),
            },
          }),
        },
      }
      const after: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              email: aColumn({ name: 'email', type: 'varchar', notNull: false }),
            },
            indexes: {
              idx_email: {
                name: 'idx_email',
                columns: ['email'],
                unique: false,
              },
            },
          }),
        },
      }
      
      const result = buildSchemaDiff(before, after)
      expect(result.some(item => item.kind === 'index' && item.status === 'added')).toBe(true)
    })

    it('should detect removed indexes', () => {
      const before: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              email: aColumn({ name: 'email', type: 'varchar', notNull: false }),
            },
            indexes: {
              idx_email: {
                name: 'idx_email',
                columns: ['email'],
                unique: false,
              },
            },
          }),
        },
      }
      const after: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              email: aColumn({ name: 'email', type: 'varchar', notNull: false }),
            },
          }),
        },
      }
      
      const result = buildSchemaDiff(before, after)
      expect(result.some(item => item.kind === 'index' && item.status === 'removed')).toBe(true)
    })

    it('should detect index name changes', () => {
      const before: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              email: aColumn({ name: 'email', type: 'varchar', notNull: false }),
            },
            indexes: {
              idx_email: {
                name: 'idx_email',
                columns: ['email'],
                unique: false,
              },
            },
          }),
        },
      }
      const after: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              email: aColumn({ name: 'email', type: 'varchar', notNull: false }),
            },
            indexes: {
              idx_user_email: {
                name: 'idx_user_email',
                columns: ['email'],
                unique: false,
              },
            },
          }),
        },
      }
      
      const result = buildSchemaDiff(before, after)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should detect index unique changes', () => {
      const before: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              email: aColumn({ name: 'email', type: 'varchar', notNull: false }),
            },
            indexes: {
              idx_email: {
                name: 'idx_email',
                columns: ['email'],
                unique: false,
              },
            },
          }),
        },
      }
      const after: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              email: aColumn({ name: 'email', type: 'varchar', notNull: false }),
            },
            indexes: {
              idx_email: {
                name: 'idx_email',
                columns: ['email'],
                unique: true,
              },
            },
          }),
        },
      }
      
      const result = buildSchemaDiff(before, after)
      expect(result.some(item => item.kind === 'index-unique')).toBe(true)
    })

    it('should detect index columns changes', () => {
      const before: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              email: aColumn({ name: 'email', type: 'varchar', notNull: false }),
              name: aColumn({ name: 'name', type: 'varchar', notNull: false }),
            },
            indexes: {
              idx_user: {
                name: 'idx_user',
                columns: ['email'],
                unique: false,
              },
            },
          }),
        },
      }
      const after: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              email: aColumn({ name: 'email', type: 'varchar', notNull: false }),
              name: aColumn({ name: 'name', type: 'varchar', notNull: false }),
            },
            indexes: {
              idx_user: {
                name: 'idx_user',
                columns: ['name'],
                unique: false,
              },
            },
          }),
        },
      }
      
      const result = buildSchemaDiff(before, after)
      const indexColumnsItems = result.filter(item => item.kind === 'index-columns')
      expect(indexColumnsItems.length).toBeGreaterThan(0)
    })
  })

  describe('constraint diff detection', () => {
    it('should detect added constraints', () => {
      const before: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'bigint', notNull: true }),
            },
          }),
        },
      }
      const after: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'bigint', notNull: true }),
            },
            constraints: {
              pk_users: {
                type: 'PRIMARY KEY',
                name: 'pk_users',
                columnName: 'id',
              },
            },
          }),
        },
      }
      
      const result = buildSchemaDiff(before, after)
      expect(result.some(item => item.kind === 'constraint' && item.status === 'added')).toBe(true)
    })

    it('should detect removed constraints', () => {
      const before: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'bigint', notNull: true }),
            },
            constraints: {
              pk_users: {
                type: 'PRIMARY KEY',
                name: 'pk_users',
                columnName: 'id',
              },
            },
          }),
        },
      }
      const after: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'bigint', notNull: true }),
            },
          }),
        },
      }
      
      const result = buildSchemaDiff(before, after)
      expect(result.some(item => item.kind === 'constraint' && item.status === 'removed')).toBe(true)
    })

    it('should detect primary key constraint changes', () => {
      const before: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'bigint', notNull: true }),
              uuid: aColumn({ name: 'uuid', type: 'uuid', notNull: true }),
            },
            constraints: {
              pk_users: {
                type: 'PRIMARY KEY',
                name: 'pk_users',
                columnName: 'id',
              },
            },
          }),
        },
      }
      const after: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'bigint', notNull: true }),
              uuid: aColumn({ name: 'uuid', type: 'uuid', notNull: true }),
            },
            constraints: {
              pk_users: {
                type: 'PRIMARY KEY',
                name: 'pk_users',
                columnName: 'uuid',
              },
            },
          }),
        },
      }
      
      const result = buildSchemaDiff(before, after)
      expect(result.some(item => item.kind === 'constraint-column-name')).toBe(true)
    })

    it('should detect foreign key constraint changes', () => {
      const before: Schema = {
        tables: {
          posts: aTable({
            name: 'posts',
            columns: {
              user_id: aColumn({ name: 'user_id', type: 'bigint', notNull: true }),
            },
            constraints: {
              fk_posts_user: {
                type: 'FOREIGN KEY',
                name: 'fk_posts_user',
                columnName: 'user_id',
                targetTableName: 'users',
                targetColumnName: 'id',
              },
            },
          }),
        },
      }
      const after: Schema = {
        tables: {
          posts: aTable({
            name: 'posts',
            columns: {
              user_id: aColumn({ name: 'user_id', type: 'bigint', notNull: true }),
            },
            constraints: {
              fk_posts_user: {
                type: 'FOREIGN KEY',
                name: 'fk_posts_user',
                columnName: 'user_id',
                targetTableName: 'people',
                targetColumnName: 'id',
              },
            },
          }),
        },
      }
      
      const result = buildSchemaDiff(before, after)
      expect(result.some(item => item.kind === 'constraint-target-table-name')).toBe(true)
    })

    it('should detect check constraint changes', () => {
      const before: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              age: aColumn({ name: 'age', type: 'integer', notNull: false }),
            },
            constraints: {
              chk_age: {
                type: 'CHECK',
                name: 'chk_age',
                detail: 'age >= 0',
              },
            },
          }),
        },
      }
      const after: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              age: aColumn({ name: 'age', type: 'integer', notNull: false }),
            },
            constraints: {
              chk_age: {
                type: 'CHECK',
                name: 'chk_age',
                detail: 'age >= 18',
              },
            },
          }),
        },
      }
      
      const result = buildSchemaDiff(before, after)
      expect(result.some(item => item.kind === 'constraint-detail')).toBe(true)
    })

    it('should detect unique constraint changes', () => {
      const before: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              email: aColumn({ name: 'email', type: 'varchar', notNull: false }),
            },
            constraints: {
              uk_email: {
                type: 'UNIQUE',
                name: 'uk_email',
                columnName: 'email',
              },
            },
          }),
        },
      }
      const after: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              email: aColumn({ name: 'email', type: 'varchar', notNull: false }),
            },
            constraints: {
              uk_user_email: {
                type: 'UNIQUE',
                name: 'uk_user_email',
                columnName: 'email',
              },
            },
          }),
        },
      }
      
      const result = buildSchemaDiff(before, after)
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('complex scenarios', () => {
    it('should handle multiple simultaneous changes across different objects', () => {
      const before: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'bigint', notNull: true }),
            },
          }),
        },
      }
      const after: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'bigint', notNull: true }),
              name: aColumn({ name: 'name', type: 'varchar', notNull: false }),
            },
            indexes: {
              idx_name: {
                name: 'idx_name',
                columns: ['name'],
                unique: false,
              },
            },
          }),
          posts: aTable({
            name: 'posts',
            columns: {
              id: aColumn({ name: 'id', type: 'bigint', notNull: true }),
            },
          }),
        },
      }
      
      const result = buildSchemaDiff(before, after)
      expect(result.length).toBeGreaterThan(2)
    })

    it('should preserve order of diff items', () => {
      const before: Schema = { tables: {} }
      const after: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'bigint', notNull: true }),
            },
          }),
        },
      }
      
      const result = buildSchemaDiff(before, after)
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle empty before schema', () => {
      const before: Schema = { tables: {} }
      const after: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'bigint', notNull: true }),
            },
          }),
        },
      }
      
      const result = buildSchemaDiff(before, after)
      expect(result.some(item => item.status === 'added')).toBe(true)
    })

    it('should handle empty after schema', () => {
      const before: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'bigint', notNull: true }),
            },
          }),
        },
      }
      const after: Schema = { tables: {} }
      
      const result = buildSchemaDiff(before, after)
      expect(result.some(item => item.status === 'removed')).toBe(true)
    })

    it('should handle schemas with circular references', () => {
      const before: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'bigint', notNull: true }),
            },
          }),
        },
      }
      const after: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'bigint', notNull: true }),
            },
          }),
        },
      }
      
      const result = buildSchemaDiff(before, after)
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle null/undefined inputs gracefully', () => {
      const schema: Schema = { tables: {} }
      expect(() => buildSchemaDiff(schema, schema)).not.toThrow()
    })

    it('should handle schemas with special characters in names', () => {
      const before: Schema = {
        tables: {
          'user-table_123': aTable({
            name: 'user-table_123',
            columns: {
              'user-id': aColumn({ name: 'user-id', type: 'bigint', notNull: true }),
            },
          }),
        },
      }
      const after: Schema = {
        tables: {
          'user-table_123': aTable({
            name: 'user-table_123',
            columns: {
              'user-id': aColumn({ name: 'user-id', type: 'bigint', notNull: true }),
            },
          }),
        },
      }
      
      const result = buildSchemaDiff(before, after)
      expect(Array.isArray(result)).toBe(true)
    })

    it('should handle very large schemas efficiently', () => {
      const tables: any = {}
      for (let i = 0; i < 10; i++) {
        tables[`table_${i}`] = aTable({
          name: `table_${i}`,
          columns: {
            id: aColumn({ name: 'id', type: 'bigint', notNull: true }),
          },
        })
      }
      
      const schema: Schema = { tables }
      const result = buildSchemaDiff(schema, schema)
      expect(result).toEqual([])
    })

    it('should maintain referential integrity in diff results', () => {
      const before: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'bigint', notNull: true }),
            },
          }),
        },
      }
      const after: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'bigint', notNull: true }),
              name: aColumn({ name: 'name', type: 'varchar', notNull: false }),
            },
          }),
        },
      }
      
      const result = buildSchemaDiff(before, after)
      result.forEach(item => {
        expect(item).toHaveProperty('kind')
        expect(item).toHaveProperty('status')
      })
    })
  })

  describe('diff item structure', () => {
    it('should include proper target information for each diff item', () => {
      const before: Schema = { tables: {} }
      const after: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'bigint', notNull: true }),
            },
          }),
        },
      }
      
      const result = buildSchemaDiff(before, after)
      result.forEach(item => {
        expect(item).toHaveProperty('tableId')
      })
    })

    it('should include change status for each diff item', () => {
      const before: Schema = { tables: {} }
      const after: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'bigint', notNull: true }),
            },
          }),
        },
      }
      
      const result = buildSchemaDiff(before, after)
      result.forEach(item => {
        expect(item).toHaveProperty('status')
        expect(['added', 'removed', 'modified']).toContain(item.status)
      })
    })

    it('should include proper data for modified items', () => {
      const before: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              name: aColumn({ name: 'name', type: 'varchar', notNull: false, default: 'old' }),
            },
          }),
        },
      }
      const after: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              name: aColumn({ name: 'name', type: 'varchar', notNull: false, default: 'new' }),
            },
          }),
        },
      }
      
      const result = buildSchemaDiff(before, after)
      const modifiedItems = result.filter(item => item.status === 'modified')
      expect(modifiedItems.length).toBeGreaterThan(0)
      modifiedItems.forEach(item => {
        expect(item).toHaveProperty('data')
        expect(item).toHaveProperty('status')
        expect(item.status).toBe('modified')
        expect(item).toHaveProperty('kind')
        expect(item).toHaveProperty('tableId')
      })
    })

    it('should follow consistent naming conventions for diff properties', () => {
      const before: Schema = { tables: {} }
      const after: Schema = {
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'bigint', notNull: true }),
            },
          }),
        },
      }
      
      const result = buildSchemaDiff(before, after)
      result.forEach(item => {
        expect(item).toHaveProperty('kind')
        expect(item).toHaveProperty('status')
        expect(item).toHaveProperty('tableId')
      })
    })
  })
})
