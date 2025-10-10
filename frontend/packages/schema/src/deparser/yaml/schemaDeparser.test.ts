import { describe, expect, it } from 'vitest'
import {
  aColumn,
  aForeignKeyConstraint,
  anEnum,
  anIndex,
  aPrimaryKeyConstraint,
  aSchema,
  aTable,
  aUniqueConstraint,
} from '../../schema/factories.js'
import { yamlSchemaDeparser } from './schemaDeparser.js'

describe('yamlSchemaDeparser', () => {
  it('should convert basic schema to YAML', () => {
    const schema = aSchema({
      tables: {
        users: aTable({
          name: 'users',
          columns: {
            id: aColumn({
              name: 'id',
              type: 'bigint',
              notNull: true,
            }),
            email: aColumn({
              name: 'email',
              type: 'varchar(255)',
              notNull: true,
            }),
          },
          constraints: {
            users_pkey: aPrimaryKeyConstraint({
              name: 'users_pkey',
              columnNames: ['id'],
            }),
          },
        }),
      },
    })

    const result = yamlSchemaDeparser(schema)._unsafeUnwrap()

    expect(result).toMatchInlineSnapshot(`
        "tables:
          users:
            name: users
            columns:
              id:
                name: id
                type: bigint
                notNull: true
              email:
                name: email
                type: varchar(255)
                notNull: true
            constraints:
              users_pkey:
                type: PRIMARY KEY
                name: users_pkey
                columnNames:
                  - id
            indexes: {}
        enums: {}
        extensions: {}
        "
      `)
  })

  it('should handle schema with comments', () => {
    const schema = aSchema({
      tables: {
        products: aTable({
          name: 'products',
          comment: 'Product table',
          columns: {
            id: aColumn({
              name: 'id',
              type: 'bigint',
              notNull: true,
              comment: 'Product ID',
            }),
          },
          constraints: {
            products_pkey: aPrimaryKeyConstraint({
              name: 'products_pkey',
              columnNames: ['id'],
            }),
          },
        }),
      },
    })

    const result = yamlSchemaDeparser(schema)._unsafeUnwrap()

    expect(result).toMatchInlineSnapshot(`
        "tables:
          products:
            name: products
            comment: Product table
            columns:
              id:
                name: id
                type: bigint
                comment: Product ID
                notNull: true
            constraints:
              products_pkey:
                type: PRIMARY KEY
                name: products_pkey
                columnNames:
                  - id
            indexes: {}
        enums: {}
        extensions: {}
        "
      `)
  })

  it('should handle schema with enums', () => {
    const schema = aSchema({
      enums: {
        status: anEnum({
          name: 'status',
          values: ['active', 'inactive', 'pending'],
        }),
      },
      tables: {},
    })

    const result = yamlSchemaDeparser(schema)._unsafeUnwrap()

    expect(result).toMatchInlineSnapshot(`
        "tables: {}
        enums:
          status:
            name: status
            values:
              - active
              - inactive
              - pending
        extensions: {}
        "
      `)
  })

  it('should handle schema with indexes', () => {
    const schema = aSchema({
      tables: {
        users: aTable({
          name: 'users',
          columns: {
            id: aColumn({
              name: 'id',
              type: 'bigint',
              notNull: true,
            }),
            email: aColumn({
              name: 'email',
              type: 'varchar(255)',
              notNull: true,
            }),
          },
          indexes: {
            idx_users_email: anIndex({
              name: 'idx_users_email',
              columns: ['email'],
              type: 'BTREE',
            }),
          },
        }),
      },
    })

    const result = yamlSchemaDeparser(schema)._unsafeUnwrap()

    expect(result).toMatchInlineSnapshot(`
        "tables:
          users:
            name: users
            columns:
              id:
                name: id
                type: bigint
                notNull: true
              email:
                name: email
                type: varchar(255)
                notNull: true
            indexes:
              idx_users_email:
                name: idx_users_email
                unique: false
                columns:
                  - email
                type: BTREE
            constraints: {}
        enums: {}
        extensions: {}
        "
      `)
  })

  it('should handle schema with foreign key constraints', () => {
    const schema = aSchema({
      tables: {
        users: aTable({
          name: 'users',
          columns: {
            id: aColumn({
              name: 'id',
              type: 'bigint',
              notNull: true,
            }),
          },
        }),
        orders: aTable({
          name: 'orders',
          columns: {
            id: aColumn({
              name: 'id',
              type: 'bigint',
              notNull: true,
            }),
            user_id: aColumn({
              name: 'user_id',
              type: 'bigint',
              notNull: true,
            }),
          },
          constraints: {
            fk_orders_user_id: aForeignKeyConstraint({
              name: 'fk_orders_user_id',
              columnNames: ['user_id'],
              targetTableName: 'users',
              targetColumnNames: ['id'],
              updateConstraint: 'CASCADE',
              deleteConstraint: 'SET_NULL',
            }),
          },
        }),
      },
    })

    const result = yamlSchemaDeparser(schema)._unsafeUnwrap()

    expect(result).toMatchInlineSnapshot(`
        "tables:
          users:
            name: users
            columns:
              id:
                name: id
                type: bigint
                notNull: true
            indexes: {}
            constraints: {}
          orders:
            name: orders
            columns:
              id:
                name: id
                type: bigint
                notNull: true
              user_id:
                name: user_id
                type: bigint
                notNull: true
            constraints:
              fk_orders_user_id:
                type: FOREIGN KEY
                name: fk_orders_user_id
                columnNames:
                  - user_id
                targetTableName: users
                targetColumnNames:
                  - id
                updateConstraint: CASCADE
                deleteConstraint: SET_NULL
            indexes: {}
        enums: {}
        extensions: {}
        "
      `)
  })

  it('should handle schema with unique constraints', () => {
    const schema = aSchema({
      tables: {
        users: aTable({
          name: 'users',
          columns: {
            id: aColumn({
              name: 'id',
              type: 'bigint',
              notNull: true,
            }),
            email: aColumn({
              name: 'email',
              type: 'varchar(255)',
              notNull: true,
            }),
          },
          constraints: {
            uk_users_email: aUniqueConstraint({
              name: 'uk_users_email',
              columnNames: ['email'],
            }),
          },
        }),
      },
    })

    const result = yamlSchemaDeparser(schema)._unsafeUnwrap()

    expect(result).toMatchInlineSnapshot(`
        "tables:
          users:
            name: users
            columns:
              id:
                name: id
                type: bigint
                notNull: true
              email:
                name: email
                type: varchar(255)
                notNull: true
            constraints:
              uk_users_email:
                type: UNIQUE
                name: uk_users_email
                columnNames:
                  - email
            indexes: {}
        enums: {}
        extensions: {}
        "
      `)
  })

  it('should handle empty schema', () => {
    const schema = aSchema({ tables: {} })

    const result = yamlSchemaDeparser(schema)._unsafeUnwrap()

    expect(result).toMatchInlineSnapshot(`
        "tables: {}
        enums: {}
        extensions: {}
        "
      `)
  })

  it('should handle complex schema with multiple tables, enums, and constraints', () => {
    const schema = aSchema({
      enums: {
        user_status: anEnum({
          name: 'user_status',
          values: ['active', 'inactive'],
        }),
      },
      tables: {
        users: aTable({
          name: 'users',
          comment: 'Users table',
          columns: {
            id: aColumn({
              name: 'id',
              type: 'bigint',
              notNull: true,
              comment: 'User ID',
            }),
            email: aColumn({
              name: 'email',
              type: 'varchar(255)',
              notNull: true,
            }),
            status: aColumn({
              name: 'status',
              type: 'user_status',
              notNull: true,
            }),
          },
          indexes: {
            idx_users_email: anIndex({
              name: 'idx_users_email',
              unique: true,
              columns: ['email'],
              type: 'BTREE',
            }),
          },
        }),
        products: aTable({
          name: 'products',
          columns: {
            id: aColumn({
              name: 'id',
              type: 'bigint',
              notNull: true,
            }),
            name: aColumn({
              name: 'name',
              type: 'varchar(100)',
              notNull: true,
            }),
          },
        }),
      },
    })

    const result = yamlSchemaDeparser(schema)._unsafeUnwrap()

    expect(result).toMatchInlineSnapshot(`
        "tables:
          users:
            name: users
            comment: Users table
            columns:
              id:
                name: id
                type: bigint
                comment: User ID
                notNull: true
              email:
                name: email
                type: varchar(255)
                notNull: true
              status:
                name: status
                type: user_status
                notNull: true
            indexes:
              idx_users_email:
                name: idx_users_email
                unique: true
                columns:
                  - email
                type: BTREE
            constraints: {}
          products:
            name: products
            columns:
              id:
                name: id
                type: bigint
                notNull: true
              name:
                name: name
                type: varchar(100)
                notNull: true
            indexes: {}
            constraints: {}
        enums:
          user_status:
            name: user_status
            values:
              - active
              - inactive
        extensions: {}
        "
      `)
  })
})
