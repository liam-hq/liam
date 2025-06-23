import { describe, expect, it } from 'vitest'
import type { Schema } from '../../schema/index.js'
import { postgresqlSchemaDeparser } from './schemaDeparser.js'

describe('postgresqlSchemaDeparser', () => {
  it('should generate basic CREATE TABLE statement', () => {
    const schema: Schema = {
      tables: {
        users: {
          name: 'users',
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
            email: {
              name: 'email',
              type: 'varchar(255)',
              primary: false,
              notNull: true,
              default: null,
              check: null,
              comment: null,
            },
          },
          comment: null,
          indexes: {},
          constraints: {},
        },
      },
      relationships: {},
      tableGroups: {},
    }

    const result = postgresqlSchemaDeparser(schema)

    expect(result.errors).toHaveLength(0)
    expect(result.value).toMatchInlineSnapshot(`
      "CREATE TABLE users (
        id bigint PRIMARY KEY,
        email varchar(255) NOT NULL
      );"
    `)
  })

  it('should generate CREATE TABLE with comments', () => {
    const schema: Schema = {
      tables: {
        products: {
          name: 'products',
          columns: {
            id: {
              name: 'id',
              type: 'bigint',
              primary: true,
              notNull: true,
              default: null,
              check: null,
              comment: 'Product ID',
            },
          },
          comment: 'Product table',
          indexes: {},
          constraints: {},
        },
      },
      relationships: {},
      tableGroups: {},
    }

    const result = postgresqlSchemaDeparser(schema)

    expect(result.errors).toHaveLength(0)
    expect(result.value).toMatchInlineSnapshot(`
      "CREATE TABLE products (
        id bigint PRIMARY KEY
      );

      COMMENT ON TABLE products IS 'Product table';
      COMMENT ON COLUMN products.id IS 'Product ID';"
    `)
  })

  it('should generate CREATE TABLE with default values', () => {
    const schema: Schema = {
      tables: {
        settings: {
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
            count: {
              name: 'count',
              type: 'integer',
              primary: false,
              notNull: false,
              default: 0,
              check: null,
              comment: null,
            },
            title: {
              name: 'title',
              type: 'varchar(50)',
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
      },
      relationships: {},
      tableGroups: {},
    }

    const result = postgresqlSchemaDeparser(schema)

    expect(result.errors).toHaveLength(0)
    expect(result.value).toMatchInlineSnapshot(`
      "CREATE TABLE settings (
        id bigint PRIMARY KEY,
        enabled boolean NOT NULL DEFAULT TRUE,
        count integer DEFAULT 0,
        title varchar(50) DEFAULT 'Default Title'
      );"
    `)
  })

  it('should handle string escaping in comments', () => {
    const schema: Schema = {
      tables: {
        test: {
          name: 'test',
          columns: {
            id: {
              name: 'id',
              type: 'bigint',
              primary: true,
              notNull: true,
              default: null,
              check: null,
              comment: "Column with 'quotes' in comment",
            },
          },
          comment: "Table with 'quotes' in comment",
          indexes: {},
          constraints: {},
        },
      },
      relationships: {},
      tableGroups: {},
    }

    const result = postgresqlSchemaDeparser(schema)

    expect(result.errors).toHaveLength(0)
    expect(result.value).toMatchInlineSnapshot(
      `
      "CREATE TABLE test (
        id bigint PRIMARY KEY
      );

      COMMENT ON TABLE test IS 'Table with ''quotes'' in comment';
      COMMENT ON COLUMN test.id IS 'Column with ''quotes'' in comment';"
    `,
    )
  })

  it('should handle multiple tables', () => {
    const schema: Schema = {
      tables: {
        users: {
          name: 'users',
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
          },
          comment: null,
          indexes: {},
          constraints: {},
        },
        products: {
          name: 'products',
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
            name: {
              name: 'name',
              type: 'varchar(100)',
              primary: false,
              notNull: true,
              default: null,
              check: null,
              comment: null,
            },
          },
          comment: null,
          indexes: {},
          constraints: {},
        },
      },
      relationships: {},
      tableGroups: {},
    }

    const result = postgresqlSchemaDeparser(schema)

    expect(result.errors).toHaveLength(0)
    expect(result.value).toMatchInlineSnapshot(`
      "CREATE TABLE users (
        id bigint PRIMARY KEY
      );

      CREATE TABLE products (
        id bigint PRIMARY KEY,
        name varchar(100) NOT NULL
      );"
    `)
  })

  it('should handle empty schema', () => {
    const schema: Schema = {
      tables: {},
      relationships: {},
      tableGroups: {},
    }

    const result = postgresqlSchemaDeparser(schema)

    expect(result.errors).toHaveLength(0)
    expect(result.value).toBe('')
  })
})
