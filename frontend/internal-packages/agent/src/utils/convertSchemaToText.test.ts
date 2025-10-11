import {
  aCheckConstraint,
  aColumn,
  aForeignKeyConstraint,
  anIndex,
  aPrimaryKeyConstraint,
  aSchema,
  aTable,
  aUniqueConstraint,
} from '@liam-hq/schema'
import { describe, expect, it } from 'vitest'
import { convertSchemaToText } from './convertSchemaToText'

describe('convertSchemaToText', () => {
  describe('basic table conversion', () => {
    it('should convert a simple table with columns', () => {
      const schema = aSchema({
        tables: {
          users: aTable({
            name: 'users',
            comment: 'User accounts',
            columns: {
              id: aColumn({ name: 'id', type: 'integer', notNull: true }),
              email: aColumn({ name: 'email', type: 'varchar', notNull: true }),
              age: aColumn({ name: 'age', type: 'integer', notNull: false }),
            },
          }),
        },
      })

      const result = convertSchemaToText(schema)
      expect(result).toMatchInlineSnapshot(`
        "FULL DATABASE SCHEMA:

        TABLES:

        Table: users
        Description: User accounts
        Columns:
        - id: integer (not nullable)
        - email: varchar (not nullable)
        - age: integer (nullable)


        "
      `)
    })

    it('should show "No description" when comment is missing', () => {
      const schema = aSchema({
        tables: {
          products: aTable({
            name: 'products',
            columns: {
              id: aColumn({ name: 'id', type: 'integer', notNull: true }),
            },
          }),
        },
      })

      const result = convertSchemaToText(schema)
      expect(result).toMatchInlineSnapshot(`
        "FULL DATABASE SCHEMA:

        TABLES:

        Table: products
        Description: No description
        Columns:
        - id: integer (not nullable)


        "
      `)
    })
  })

  describe('column-level CHECK constraints', () => {
    it('should include CHECK constraint in column output', () => {
      const schema = aSchema({
        tables: {
          products: aTable({
            name: 'products',
            columns: {
              price: aColumn({
                name: 'price',
                type: 'decimal',
                notNull: true,
                check: 'price > 0',
              }),
              quantity: aColumn({
                name: 'quantity',
                type: 'integer',
                notNull: true,
                check: 'quantity >= 0',
              }),
            },
          }),
        },
      })

      const result = convertSchemaToText(schema)
      expect(result).toMatchInlineSnapshot(`
        "FULL DATABASE SCHEMA:

        TABLES:

        Table: products
        Description: No description
        Columns:
        - price: decimal (not nullable)
          Check: price > 0
        - quantity: integer (not nullable)
          Check: quantity >= 0


        "
      `)
    })

    it('should include column comment and CHECK constraint together', () => {
      const schema = aSchema({
        tables: {
          products: aTable({
            name: 'products',
            columns: {
              price: aColumn({
                name: 'price',
                type: 'decimal',
                notNull: true,
                comment: 'Product price in USD',
                check: 'price > 0',
              }),
            },
          }),
        },
      })

      const result = convertSchemaToText(schema)
      expect(result).toMatchInlineSnapshot(`
        "FULL DATABASE SCHEMA:

        TABLES:

        Table: products
        Description: No description
        Columns:
        - price: decimal (not nullable)
          Description: Product price in USD
          Check: price > 0


        "
      `)
    })
  })

  describe('primary key formatting', () => {
    it('should format single-column primary key', () => {
      const schema = aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'integer', notNull: true }),
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

      const result = convertSchemaToText(schema)
      expect(result).toMatchInlineSnapshot(`
        "FULL DATABASE SCHEMA:

        TABLES:

        Table: users
        Description: No description
        Columns:
        - id: integer (not nullable)
        Primary Key: id


        "
      `)
    })

    it('should format composite primary key', () => {
      const schema = aSchema({
        tables: {
          user_roles: aTable({
            name: 'user_roles',
            columns: {
              user_id: aColumn({
                name: 'user_id',
                type: 'integer',
                notNull: true,
              }),
              role_id: aColumn({
                name: 'role_id',
                type: 'integer',
                notNull: true,
              }),
            },
            constraints: {
              user_roles_pkey: aPrimaryKeyConstraint({
                name: 'user_roles_pkey',
                columnNames: ['user_id', 'role_id'],
              }),
            },
          }),
        },
      })

      const result = convertSchemaToText(schema)
      expect(result).toMatchInlineSnapshot(`
        "FULL DATABASE SCHEMA:

        TABLES:

        Table: user_roles
        Description: No description
        Columns:
        - user_id: integer (not nullable)
        - role_id: integer (not nullable)
        Primary Key: user_id, role_id


        "
      `)
    })
  })

  describe('constraints formatting', () => {
    it('should format FOREIGN KEY constraints', () => {
      const schema = aSchema({
        tables: {
          posts: aTable({
            name: 'posts',
            columns: {
              id: aColumn({ name: 'id', type: 'integer', notNull: true }),
              user_id: aColumn({
                name: 'user_id',
                type: 'integer',
                notNull: true,
              }),
            },
            constraints: {
              posts_user_id_fkey: aForeignKeyConstraint({
                name: 'posts_user_id_fkey',
                columnNames: ['user_id'],
                targetTableName: 'users',
                targetColumnNames: ['id'],
              }),
            },
          }),
        },
      })

      const result = convertSchemaToText(schema)
      expect(result).toMatchInlineSnapshot(`
        "FULL DATABASE SCHEMA:

        TABLES:

        Table: posts
        Description: No description
        Columns:
        - id: integer (not nullable)
        - user_id: integer (not nullable)
        Constraints:
        - posts_user_id_fkey (FOREIGN KEY): user_id -> users(id)


        "
      `)
    })

    it('should format UNIQUE constraints', () => {
      const schema = aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'integer', notNull: true }),
              email: aColumn({ name: 'email', type: 'varchar', notNull: true }),
            },
            constraints: {
              users_email_key: aUniqueConstraint({
                name: 'users_email_key',
                columnNames: ['email'],
              }),
            },
          }),
        },
      })

      const result = convertSchemaToText(schema)
      expect(result).toMatchInlineSnapshot(`
        "FULL DATABASE SCHEMA:

        TABLES:

        Table: users
        Description: No description
        Columns:
        - id: integer (not nullable)
        - email: varchar (not nullable)
        Constraints:
        - users_email_key (UNIQUE): email


        "
      `)
    })

    it('should format table-level CHECK constraints', () => {
      const schema = aSchema({
        tables: {
          events: aTable({
            name: 'events',
            columns: {
              start_date: aColumn({
                name: 'start_date',
                type: 'date',
                notNull: true,
              }),
              end_date: aColumn({
                name: 'end_date',
                type: 'date',
                notNull: true,
              }),
            },
            constraints: {
              events_date_check: aCheckConstraint({
                name: 'events_date_check',
                detail: 'end_date >= start_date',
              }),
            },
          }),
        },
      })

      const result = convertSchemaToText(schema)
      expect(result).toMatchInlineSnapshot(`
        "FULL DATABASE SCHEMA:

        TABLES:

        Table: events
        Description: No description
        Columns:
        - start_date: date (not nullable)
        - end_date: date (not nullable)
        Constraints:
        - events_date_check (CHECK): end_date >= start_date


        "
      `)
    })

    it('should skip PRIMARY KEY in Constraints section', () => {
      const schema = aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'integer', notNull: true }),
              email: aColumn({ name: 'email', type: 'varchar', notNull: true }),
            },
            constraints: {
              users_pkey: aPrimaryKeyConstraint({
                name: 'users_pkey',
                columnNames: ['id'],
              }),
              users_email_key: aUniqueConstraint({
                name: 'users_email_key',
                columnNames: ['email'],
              }),
            },
          }),
        },
      })

      const result = convertSchemaToText(schema)
      expect(result).toMatchInlineSnapshot(`
        "FULL DATABASE SCHEMA:

        TABLES:

        Table: users
        Description: No description
        Columns:
        - id: integer (not nullable)
        - email: varchar (not nullable)
        Primary Key: id
        Constraints:
        - users_email_key (UNIQUE): email


        "
      `)
    })

    it('should not show Constraints section when only PRIMARY KEY exists', () => {
      const schema = aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'integer', notNull: true }),
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

      const result = convertSchemaToText(schema)
      expect(result).toMatchInlineSnapshot(`
        "FULL DATABASE SCHEMA:

        TABLES:

        Table: users
        Description: No description
        Columns:
        - id: integer (not nullable)
        Primary Key: id


        "
      `)
    })

    it('should not show Constraints section when no constraints exist', () => {
      const schema = aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'integer', notNull: true }),
            },
          }),
        },
      })

      const result = convertSchemaToText(schema)
      expect(result).toMatchInlineSnapshot(`
        "FULL DATABASE SCHEMA:

        TABLES:

        Table: users
        Description: No description
        Columns:
        - id: integer (not nullable)


        "
      `)
    })
  })

  describe('indexes formatting', () => {
    it('should format UNIQUE indexes', () => {
      const schema = aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'integer', notNull: true }),
              email: aColumn({ name: 'email', type: 'varchar', notNull: true }),
            },
            indexes: {
              users_email_idx: anIndex({
                name: 'users_email_idx',
                columns: ['email'],
                unique: true,
              }),
            },
          }),
        },
      })

      const result = convertSchemaToText(schema)
      expect(result).toMatchInlineSnapshot(`
        "FULL DATABASE SCHEMA:

        TABLES:

        Table: users
        Description: No description
        Columns:
        - id: integer (not nullable)
        - email: varchar (not nullable)
        Indexes:
        - users_email_idx (UNIQUE): email


        "
      `)
    })

    it('should format NON-UNIQUE indexes', () => {
      const schema = aSchema({
        tables: {
          posts: aTable({
            name: 'posts',
            columns: {
              id: aColumn({ name: 'id', type: 'integer', notNull: true }),
              created_at: aColumn({
                name: 'created_at',
                type: 'timestamp',
                notNull: true,
              }),
            },
            indexes: {
              posts_created_at_idx: anIndex({
                name: 'posts_created_at_idx',
                columns: ['created_at'],
                unique: false,
              }),
            },
          }),
        },
      })

      const result = convertSchemaToText(schema)
      expect(result).toMatchInlineSnapshot(`
        "FULL DATABASE SCHEMA:

        TABLES:

        Table: posts
        Description: No description
        Columns:
        - id: integer (not nullable)
        - created_at: timestamp (not nullable)
        Indexes:
        - posts_created_at_idx (NON-UNIQUE): created_at


        "
      `)
    })

    it('should format composite indexes', () => {
      const schema = aSchema({
        tables: {
          user_activities: aTable({
            name: 'user_activities',
            columns: {
              user_id: aColumn({
                name: 'user_id',
                type: 'integer',
                notNull: true,
              }),
              activity_type: aColumn({
                name: 'activity_type',
                type: 'varchar',
                notNull: true,
              }),
              created_at: aColumn({
                name: 'created_at',
                type: 'timestamp',
                notNull: true,
              }),
            },
            indexes: {
              user_activities_composite_idx: anIndex({
                name: 'user_activities_composite_idx',
                columns: ['user_id', 'activity_type', 'created_at'],
                unique: false,
              }),
            },
          }),
        },
      })

      const result = convertSchemaToText(schema)
      expect(result).toMatchInlineSnapshot(`
        "FULL DATABASE SCHEMA:

        TABLES:

        Table: user_activities
        Description: No description
        Columns:
        - user_id: integer (not nullable)
        - activity_type: varchar (not nullable)
        - created_at: timestamp (not nullable)
        Indexes:
        - user_activities_composite_idx (NON-UNIQUE): user_id, activity_type, created_at


        "
      `)
    })

    it('should not show Indexes section when no indexes exist', () => {
      const schema = aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'integer', notNull: true }),
            },
          }),
        },
      })

      const result = convertSchemaToText(schema)
      expect(result).toMatchInlineSnapshot(`
        "FULL DATABASE SCHEMA:

        TABLES:

        Table: users
        Description: No description
        Columns:
        - id: integer (not nullable)


        "
      `)
    })
  })

  describe('complete table with all features', () => {
    it('should format a table with columns, primary key, constraints, and indexes', () => {
      const schema = aSchema({
        tables: {
          orders: aTable({
            name: 'orders',
            comment: 'Customer orders',
            columns: {
              id: aColumn({ name: 'id', type: 'integer', notNull: true }),
              user_id: aColumn({
                name: 'user_id',
                type: 'integer',
                notNull: true,
              }),
              total_amount: aColumn({
                name: 'total_amount',
                type: 'decimal',
                notNull: true,
                comment: 'Order total in USD',
                check: 'total_amount >= 0',
              }),
              status: aColumn({
                name: 'status',
                type: 'varchar',
                notNull: true,
              }),
              created_at: aColumn({
                name: 'created_at',
                type: 'timestamp',
                notNull: true,
              }),
            },
            constraints: {
              orders_pkey: aPrimaryKeyConstraint({
                name: 'orders_pkey',
                columnNames: ['id'],
              }),
              orders_user_id_fkey: aForeignKeyConstraint({
                name: 'orders_user_id_fkey',
                columnNames: ['user_id'],
                targetTableName: 'users',
                targetColumnNames: ['id'],
              }),
              orders_status_check: aCheckConstraint({
                name: 'orders_status_check',
                detail: "status IN ('pending', 'completed', 'cancelled')",
              }),
            },
            indexes: {
              orders_user_id_idx: anIndex({
                name: 'orders_user_id_idx',
                columns: ['user_id'],
                unique: false,
              }),
              orders_created_at_idx: anIndex({
                name: 'orders_created_at_idx',
                columns: ['created_at'],
                unique: false,
              }),
            },
          }),
        },
      })

      const result = convertSchemaToText(schema)
      expect(result).toMatchInlineSnapshot(`
        "FULL DATABASE SCHEMA:

        TABLES:

        Table: orders
        Description: Customer orders
        Columns:
        - id: integer (not nullable)
        - user_id: integer (not nullable)
        - total_amount: decimal (not nullable)
          Description: Order total in USD
          Check: total_amount >= 0
        - status: varchar (not nullable)
        - created_at: timestamp (not nullable)
        Primary Key: id
        Constraints:
        - orders_user_id_fkey (FOREIGN KEY): user_id -> users(id)
        - orders_status_check (CHECK): status IN ('pending', 'completed', 'cancelled')
        Indexes:
        - orders_user_id_idx (NON-UNIQUE): user_id
        - orders_created_at_idx (NON-UNIQUE): created_at


        "
      `)
    })
  })

  describe('multiple tables', () => {
    it('should format multiple tables correctly', () => {
      const schema = aSchema({
        tables: {
          users: aTable({
            name: 'users',
            comment: 'User accounts',
            columns: {
              id: aColumn({ name: 'id', type: 'integer', notNull: true }),
            },
          }),
          posts: aTable({
            name: 'posts',
            comment: 'Blog posts',
            columns: {
              id: aColumn({ name: 'id', type: 'integer', notNull: true }),
            },
          }),
        },
      })

      const result = convertSchemaToText(schema)
      expect(result).toMatchInlineSnapshot(`
        "FULL DATABASE SCHEMA:

        TABLES:

        Table: users
        Description: User accounts
        Columns:
        - id: integer (not nullable)


        Table: posts
        Description: Blog posts
        Columns:
        - id: integer (not nullable)


        "
      `)
    })
  })
})
