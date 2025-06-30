import { describe, expect, it } from 'vitest'
import { postgresqlSchemaDeparser } from './schemaDeparser.js'
import { expectGeneratedSQLToBeParseable } from './testUtils.js'
import { SQL_SNAPSHOTS } from './__fixtures__/sql-snapshots.js'
import {
  SCHEMA_BUILDERS,
  createBasicColumn,
  createCheckConstraint,
  createForeignKeyConstraint,
  createIndex,
  createPrimaryKeyConstraint,
  createSchemaWithTable,
  createSchemaWithTables,
  createTableWithColumns,
  createUniqueConstraint,
} from './__fixtures__/schema-builders.js'

describe('postgresqlSchemaDeparser', () => {
  it('should generate basic CREATE TABLE statement', async () => {
    const table = createTableWithColumns('users', {
      id: createBasicColumn('id', 'bigint', { notNull: true }),
      email: createBasicColumn('email', 'varchar(255)', { notNull: true }),
    }, {
      constraints: {
        users_pkey: createPrimaryKeyConstraint('users_pkey', 'id'),
      },
    })
    const schema = createSchemaWithTable('users', table)

    const result = postgresqlSchemaDeparser(schema)

    expect(result.errors).toHaveLength(0)
    expect(result.value).toBe(SQL_SNAPSHOTS.basicCreateTable)

    await expectGeneratedSQLToBeParseable(result.value)
  })

  it('should generate CREATE TABLE with comments', async () => {
    const table = createTableWithColumns('products', {
      id: createBasicColumn('id', 'bigint', {
        notNull: true,
        comment: 'Product ID',
      }),
    }, {
      comment: 'Product table',
      constraints: {
        products_pkey: createPrimaryKeyConstraint('products_pkey', 'id'),
      },
    })
    const schema = createSchemaWithTable('products', table)

    const result = postgresqlSchemaDeparser(schema)

    expect(result.errors).toHaveLength(0)
    expect(result.value).toBe(SQL_SNAPSHOTS.createTableWithComments)

    await expectGeneratedSQLToBeParseable(result.value)
  })

  it('should generate CREATE TABLE with default values', async () => {
    const table = createTableWithColumns('settings', {
      id: createBasicColumn('id', 'bigint', { notNull: true }),
      enabled: createBasicColumn('enabled', 'boolean', {
        notNull: true,
        default: true,
      }),
      count: createBasicColumn('count', 'integer', { default: 0 }),
      title: createBasicColumn('title', 'varchar(50)', {
        default: 'Default Title',
      }),
    }, {
      constraints: {
        settings_pkey: createPrimaryKeyConstraint('settings_pkey', 'id'),
      },
    })
    const schema = createSchemaWithTable('settings', table)

    const result = postgresqlSchemaDeparser(schema)

    expect(result.errors).toHaveLength(0)
    expect(result.value).toBe(SQL_SNAPSHOTS.createTableWithDefaults)

    await expectGeneratedSQLToBeParseable(result.value)
  })

  it('should handle string escaping in comments', async () => {
    const table = createTableWithColumns('test', {
      id: createBasicColumn('id', 'bigint', {
        notNull: true,
        comment: "Column with 'quotes' in comment",
      }),
    }, {
      comment: "Table with 'quotes' in comment",
      constraints: {
        test_pkey: createPrimaryKeyConstraint('test_pkey', 'id'),
      },
    })
    const schema = createSchemaWithTable('test', table)

    const result = postgresqlSchemaDeparser(schema)

    expect(result.errors).toHaveLength(0)
    expect(result.value).toBe(SQL_SNAPSHOTS.stringEscapingInComments)

    await expectGeneratedSQLToBeParseable(result.value)
  })

  it('should handle multiple tables', async () => {
    const usersTable = createTableWithColumns('users', {
      id: createBasicColumn('id', 'bigint', { notNull: true }),
    }, {
      constraints: {
        users_pkey: createPrimaryKeyConstraint('users_pkey', 'id'),
      },
    })
    const productsTable = createTableWithColumns('products', {
      id: createBasicColumn('id', 'bigint', { notNull: true }),
      name: createBasicColumn('name', 'varchar(100)', { notNull: true }),
    }, {
      constraints: {
        products_pkey: createPrimaryKeyConstraint('products_pkey', 'id'),
      },
    })
    const schema = createSchemaWithTables({
      users: usersTable,
      products: productsTable,
    })

    const result = postgresqlSchemaDeparser(schema)

    expect(result.errors).toHaveLength(0)
    expect(result.value).toBe(SQL_SNAPSHOTS.multipleTables)

    await expectGeneratedSQLToBeParseable(result.value)
  })

  it('should handle empty schema', async () => {
    const schema = createSchemaWithTables({})

    const result = postgresqlSchemaDeparser(schema)

    expect(result.errors).toHaveLength(0)
    expect(result.value).toBe('')

    await expectGeneratedSQLToBeParseable(result.value)
  })

  describe('index generation', () => {
    it('should generate CREATE INDEX statements', async () => {
      const table = createTableWithColumns('users', {
        id: createBasicColumn('id', 'bigint', { notNull: true }),
        email: createBasicColumn('email', 'varchar(255)', { notNull: true }),
      }, {
        indexes: {
          idx_users_email: createIndex('idx_users_email', ['email'], {
            type: 'BTREE',
          }),
        },
      })
      const schema = createSchemaWithTable('users', table)

      const result = postgresqlSchemaDeparser(schema)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toBe(SQL_SNAPSHOTS.createIndexStatements)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate UNIQUE INDEX statements', async () => {
      const table = createTableWithColumns('users', {
        id: createBasicColumn('id', 'bigint', { notNull: true }),
        username: createBasicColumn('username', 'varchar(50)', {
          notNull: true,
        }),
      }, {
        indexes: {
          idx_users_username_unique: createIndex(
            'idx_users_username_unique',
            ['username'],
            { unique: true, type: 'BTREE' },
          ),
        },
      })
      const schema = createSchemaWithTable('users', table)

      const result = postgresqlSchemaDeparser(schema)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toBe(SQL_SNAPSHOTS.uniqueIndexStatements)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate composite INDEX statements', async () => {
      const table = createTableWithColumns('orders', {
        id: createBasicColumn('id', 'bigint', { notNull: true }),
        user_id: createBasicColumn('user_id', 'bigint', { notNull: true }),
        created_at: createBasicColumn('created_at', 'timestamp', {
          notNull: true,
        }),
      }, {
        indexes: {
          idx_orders_user_date: createIndex(
            'idx_orders_user_date',
            ['user_id', 'created_at'],
            { type: 'BTREE' },
          ),
        },
      })
      const schema = createSchemaWithTable('orders', table)

      const result = postgresqlSchemaDeparser(schema)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toBe(SQL_SNAPSHOTS.compositeIndexStatements)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should handle indexes without type specified', async () => {
      const table = createTableWithColumns('products', {
        id: createBasicColumn('id', 'bigint', { notNull: true }),
        category_id: createBasicColumn('category_id', 'bigint'),
      }, {
        indexes: {
          idx_products_category: createIndex(
            'idx_products_category',
            ['category_id'],
          ),
        },
      })
      const schema = createSchemaWithTable('products', table)

      const result = postgresqlSchemaDeparser(schema)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toBe(SQL_SNAPSHOTS.indexWithoutType)

      await expectGeneratedSQLToBeParseable(result.value)
    })
  })

  describe('constraint generation', () => {
    it('should generate PRIMARY KEY constraints', async () => {
      const table = createTableWithColumns('users', {
        id: createBasicColumn('id', 'bigint', { notNull: true }),
      }, {
        constraints: {
          pk_users_id: createPrimaryKeyConstraint('pk_users_id', 'id'),
        },
      })
      const schema = createSchemaWithTable('users', table)

      const result = postgresqlSchemaDeparser(schema)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toBe(SQL_SNAPSHOTS.primaryKeyConstraints)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate FOREIGN KEY constraints', async () => {
      const usersTable = createTableWithColumns('users', {
        id: createBasicColumn('id', 'bigint', { notNull: true }),
      })
      const ordersTable = createTableWithColumns('orders', {
        id: createBasicColumn('id', 'bigint', { notNull: true }),
        user_id: createBasicColumn('user_id', 'bigint', { notNull: true }),
      }, {
        constraints: {
          fk_orders_user_id: createForeignKeyConstraint(
            'fk_orders_user_id',
            'user_id',
            'users',
            'id',
            {
              updateConstraint: 'CASCADE',
              deleteConstraint: 'SET_NULL',
            },
          ),
        },
      })
      const schema = createSchemaWithTables({
        users: usersTable,
        orders: ordersTable,
      })

      const result = postgresqlSchemaDeparser(schema)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toBe(SQL_SNAPSHOTS.foreignKeyConstraints)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate UNIQUE constraints', async () => {
      const table = createTableWithColumns('users', {
        id: createBasicColumn('id', 'bigint', { notNull: true }),
        email: createBasicColumn('email', 'varchar(255)', { notNull: true }),
      }, {
        constraints: {
          uk_users_email: createUniqueConstraint('uk_users_email', 'email'),
        },
      })
      const schema = createSchemaWithTable('users', table)

      const result = postgresqlSchemaDeparser(schema)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toBe(SQL_SNAPSHOTS.uniqueConstraints)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate CHECK constraints', async () => {
      const table = createTableWithColumns('products', {
        id: createBasicColumn('id', 'bigint', { notNull: true }),
        price: createBasicColumn('price', 'decimal(10,2)', { notNull: true }),
      }, {
        constraints: {
          ck_products_price_positive: createCheckConstraint(
            'ck_products_price_positive',
            'price > 0',
          ),
        },
      })
      const schema = createSchemaWithTable('products', table)

      const result = postgresqlSchemaDeparser(schema)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toBe(SQL_SNAPSHOTS.checkConstraints)

      await expectGeneratedSQLToBeParseable(result.value)
    })
  })

  describe('complex schemas', () => {
    it('should handle schema with multiple tables, indexes, and constraints', async () => {
      const usersTable = createTableWithColumns('users', {
        id: createBasicColumn('id', 'bigint', {
          notNull: true,
          comment: 'User ID',
        }),
        email: createBasicColumn('email', 'varchar(255)', { notNull: true }),
        created_at: createBasicColumn('created_at', 'timestamp', {
          notNull: true,
          default: 'CURRENT_TIMESTAMP',
        }),
      }, {
        comment: 'Users table',
        indexes: {
          idx_users_email: createIndex('idx_users_email', ['email'], {
            unique: true,
            type: 'BTREE',
          }),
        },
      })

      const productsTable = createTableWithColumns('products', {
        id: createBasicColumn('id', 'bigint', { notNull: true }),
        name: createBasicColumn('name', 'varchar(100)', { notNull: true }),
        price: createBasicColumn('price', 'decimal(10,2)', {
          notNull: true,
          default: 0,
        }),
      }, {
        indexes: {
          idx_products_name: createIndex('idx_products_name', ['name']),
        },
        constraints: {
          ck_products_price: createCheckConstraint(
            'ck_products_price',
            'price >= 0',
          ),
        },
      })

      const ordersTable = createTableWithColumns('orders', {
        id: createBasicColumn('id', 'bigint', { notNull: true }),
        user_id: createBasicColumn('user_id', 'bigint', { notNull: true }),
        product_id: createBasicColumn('product_id', 'bigint', {
          notNull: true,
        }),
        quantity: createBasicColumn('quantity', 'integer', {
          notNull: true,
          default: 1,
        }),
      }, {
        indexes: {
          idx_orders_user_product: createIndex(
            'idx_orders_user_product',
            ['user_id', 'product_id'],
            { type: 'BTREE' },
          ),
        },
        constraints: {
          fk_orders_user: createForeignKeyConstraint(
            'fk_orders_user',
            'user_id',
            'users',
            'id',
            {
              updateConstraint: 'CASCADE',
              deleteConstraint: 'CASCADE',
            },
          ),
          fk_orders_product: createForeignKeyConstraint(
            'fk_orders_product',
            'product_id',
            'products',
            'id',
            {
              updateConstraint: 'CASCADE',
              deleteConstraint: 'RESTRICT',
            },
          ),
        },
      })

      const schema = createSchemaWithTables({
        users: usersTable,
        products: productsTable,
        orders: ordersTable,
      })

      const result = postgresqlSchemaDeparser(schema)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toBe(SQL_SNAPSHOTS.complexSchema)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should handle circular foreign key references', async () => {
      const departmentsTable = createTableWithColumns('departments', {
        id: createBasicColumn('id', 'bigint', { notNull: true }),
        name: createBasicColumn('name', 'varchar(100)', { notNull: true }),
        manager_id: createBasicColumn('manager_id', 'bigint'),
      }, {
        constraints: {
          fk_departments_manager: createForeignKeyConstraint(
            'fk_departments_manager',
            'manager_id',
            'employees',
            'id',
            {
              updateConstraint: 'CASCADE',
              deleteConstraint: 'SET_NULL',
            },
          ),
        },
      })

      const employeesTable = createTableWithColumns('employees', {
        id: createBasicColumn('id', 'bigint', { notNull: true }),
        name: createBasicColumn('name', 'varchar(100)', { notNull: true }),
        department_id: createBasicColumn('department_id', 'bigint', {
          notNull: true,
        }),
      }, {
        constraints: {
          fk_employees_department: createForeignKeyConstraint(
            'fk_employees_department',
            'department_id',
            'departments',
            'id',
            {
              updateConstraint: 'CASCADE',
              deleteConstraint: 'RESTRICT',
            },
          ),
        },
      })

      const schema = createSchemaWithTables({
        departments: departmentsTable,
        employees: employeesTable,
      })

      const result = postgresqlSchemaDeparser(schema)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toBe(SQL_SNAPSHOTS.circularForeignKeys)

      await expectGeneratedSQLToBeParseable(result.value)
    })
  })

  describe('error handling', () => {
    it('should handle empty table name', async () => {
      const table = createTableWithColumns('', {
        id: createBasicColumn('id', 'bigint', { notNull: true }),
      })
      const schema = createSchemaWithTables({
        '': table,
      })

      const result = postgresqlSchemaDeparser(schema)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toContain('CREATE TABLE ""')
    })
  })
})
