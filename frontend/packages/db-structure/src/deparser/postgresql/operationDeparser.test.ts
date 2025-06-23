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
              default: null,
              check: null,
              comment: 'User ID',
            },
            email: {
              name: 'email',
              type: 'varchar(255)',
              primary: false,
              notNull: true,
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
        "CREATE TABLE \"users\" (
          \"id\" bigint PRIMARY KEY,
          \"email\" varchar(255) NOT NULL
        );

        COMMENT ON TABLE \"users\" IS 'User table';
        COMMENT ON COLUMN \"users\".\"id\" IS 'User ID';
        COMMENT ON COLUMN \"users\".\"email\" IS 'User email';"
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
              default: null,
              check: null,
              comment: null,
            },
            enabled: {
              name: 'enabled',
              type: 'boolean',
              primary: false,
              notNull: true,
              default: true,
              check: null,
              comment: null,
            },
            title: {
              name: 'title',
              type: 'varchar(100)',
              primary: false,
              notNull: false,
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
        "CREATE TABLE \"settings\" (
          \"id\" bigint PRIMARY KEY,
          \"enabled\" boolean NOT NULL DEFAULT TRUE,
          \"title\" varchar(100) DEFAULT 'Default Title'
        );"
      `)
    })

    it('should generate DROP TABLE statement from remove operation', () => {
      const operation: Operation = {
        op: 'remove',
        path: '/tables/users',
      }

      const result = postgresqlOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "DROP TABLE \"users\";"
      `)
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
          default: null,
          check: null,
          comment: 'User age',
        },
      }

      const result = postgresqlOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "ALTER TABLE \"users\" ADD COLUMN \"age\" integer;

        COMMENT ON COLUMN \"users\".\"age\" IS 'User age';"
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
          default: 0.0,
          check: null,
          comment: null,
        },
      }

      const result = postgresqlOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "ALTER TABLE \"products\" ADD COLUMN \"price\" decimal(10,2) NOT NULL DEFAULT 0;"
      `)
    })

    it('should generate DROP COLUMN statement from remove operation', () => {
      const operation: Operation = {
        op: 'remove',
        path: '/tables/users/columns/age',
      }

      const result = postgresqlOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "ALTER TABLE \"users\" DROP COLUMN \"age\";"
      `)
    })
  })

  describe('index operations', () => {
    it('should generate CREATE INDEX statement from add operation', () => {
      const operation: Operation = {
        op: 'add',
        path: '/tables/users/indexes/idx_users_email',
        value: {
          name: 'idx_users_email',
          unique: false,
          columns: ['email'],
          type: 'BTREE',
        },
      }

      const result = postgresqlOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "CREATE INDEX idx_users_email ON users USING BTREE (email);"
      `)
    })

    it('should generate CREATE UNIQUE INDEX statement', () => {
      const operation: Operation = {
        op: 'add',
        path: '/tables/users/indexes/idx_users_username_unique',
        value: {
          name: 'idx_users_username_unique',
          unique: true,
          columns: ['username'],
          type: 'BTREE',
        },
      }

      const result = postgresqlOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "CREATE UNIQUE INDEX idx_users_username_unique ON users USING BTREE (username);"
      `)
    })

    it('should generate CREATE INDEX with multiple columns', () => {
      const operation: Operation = {
        op: 'add',
        path: '/tables/orders/indexes/idx_orders_user_date',
        value: {
          name: 'idx_orders_user_date',
          unique: false,
          columns: ['user_id', 'created_at'],
          type: 'BTREE',
        },
      }

      const result = postgresqlOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "CREATE INDEX idx_orders_user_date ON orders USING BTREE (user_id, created_at);"
      `)
    })

    it('should generate CREATE INDEX without index type', () => {
      const operation: Operation = {
        op: 'add',
        path: '/tables/products/indexes/idx_products_category',
        value: {
          name: 'idx_products_category',
          unique: false,
          columns: ['category_id'],
          type: '',
        },
      }

      const result = postgresqlOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "CREATE INDEX idx_products_category ON products (category_id);"
      `)
    })
  })
})
