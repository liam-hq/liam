import { describe, expect, it } from 'vitest'
import type { Operation } from '../../operation/schema/index.js'
import { postgresqlOperationDeparser } from './operationDeparser.js'

describe('postgresqlOperationDeparser', () => {
  describe('table operations', () => {
    it('should generate CREATE TABLE statement from add operation', () => {
      const operation: Operation = {
        op: 'add',
        path: '/tables/users',
        value: {
          name: 'users',
          columns: {
            id: {
              name: 'id',
              type: 'bigint',
              primary: true,
              notNull: true,
              unique: false,
              default: null,
              check: null,
              comment: 'User ID',
            },
            email: {
              name: 'email',
              type: 'varchar(255)',
              primary: false,
              notNull: true,
              unique: true,
              default: null,
              check: null,
              comment: 'User email',
            },
          },
          comment: 'User table',
          indexes: {},
          constraints: {},
        },
      }

      const result = postgresqlOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "CREATE TABLE users (
          id bigint PRIMARY KEY,
          email varchar(255) UNIQUE NOT NULL
        );

        COMMENT ON TABLE users IS 'User table';
        COMMENT ON COLUMN users.id IS 'User ID';
        COMMENT ON COLUMN users.email IS 'User email';"
      `)
    })

    it('should generate CREATE TABLE with default values', () => {
      const operation: Operation = {
        op: 'add',
        path: '/tables/settings',
        value: {
          name: 'settings',
          columns: {
            id: {
              name: 'id',
              type: 'bigint',
              primary: true,
              notNull: true,
              unique: false,
              default: null,
              check: null,
              comment: null,
            },
            enabled: {
              name: 'enabled',
              type: 'boolean',
              primary: false,
              notNull: true,
              unique: false,
              default: true,
              check: null,
              comment: null,
            },
            title: {
              name: 'title',
              type: 'varchar(100)',
              primary: false,
              notNull: false,
              unique: false,
              default: 'Default Title',
              check: null,
              comment: null,
            },
          },
          comment: null,
          indexes: {},
          constraints: {},
        },
      }

      const result = postgresqlOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "CREATE TABLE settings (
          id bigint PRIMARY KEY,
          enabled boolean NOT NULL DEFAULT TRUE,
          title varchar(100) DEFAULT 'Default Title'
        );"
      `)
    })

    it('should return error for unsupported DROP TABLE operation', () => {
      const operation: Operation = {
        op: 'remove',
        path: '/tables/users',
      }

      const result = postgresqlOperationDeparser(operation)

      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]?.message).toContain('Unsupported operation')
      expect(result.value).toBe('')
    })
  })

  describe('column operations', () => {
    it('should generate ADD COLUMN statement from add operation', () => {
      const operation: Operation = {
        op: 'add',
        path: '/tables/users/columns/age',
        value: {
          name: 'age',
          type: 'integer',
          primary: false,
          notNull: false,
          unique: false,
          default: null,
          check: null,
          comment: 'User age',
        },
      }

      const result = postgresqlOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "ALTER TABLE users ADD COLUMN age integer;

        COMMENT ON COLUMN users.age IS 'User age';"
      `)
    })

    it('should generate ADD COLUMN with constraints', () => {
      const operation: Operation = {
        op: 'add',
        path: '/tables/products/columns/price',
        value: {
          name: 'price',
          type: 'decimal(10,2)',
          primary: false,
          notNull: true,
          unique: false,
          default: 0.0,
          check: null,
          comment: null,
        },
      }

      const result = postgresqlOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "ALTER TABLE products ADD COLUMN price decimal(10,2) NOT NULL DEFAULT 0;"
      `)
    })
  })
})
