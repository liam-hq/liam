import { describe, expect, it } from 'vitest'
import {
  aColumn,
  aForeignKeyConstraint,
  anIndex,
  aPrimaryKeyConstraint,
  aSchema,
  aTable,
} from '../../schema/factories.js'
import { postgresqlSchemaDiffDeparser } from './schemaDiffDeparser.js'
import { expectGeneratedSQLToBeParseable } from './testUtils.js'

describe('postgresqlSchemaDiffDeparser', () => {
  describe('table operations', () => {
    it('should generate CREATE TABLE for added table', async () => {
      const before = aSchema({
        tables: {},
      })

      const after = aSchema({
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

      const result = postgresqlSchemaDiffDeparser(before, after)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toContain('CREATE TABLE "users"')
      expect(result.value).toContain('ADD CONSTRAINT "users_pkey" PRIMARY KEY')

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate DROP TABLE for removed table', async () => {
      const before = aSchema({
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
        },
      })

      const after = aSchema({
        tables: {},
      })

      const result = postgresqlSchemaDiffDeparser(before, after)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`"DROP TABLE "users";"`)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate RENAME TABLE for table name change', async () => {
      const before = aSchema({
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
        },
      })

      const after = aSchema({
        tables: {
          users: aTable({
            name: 'members',
            columns: {
              id: aColumn({
                name: 'id',
                type: 'bigint',
                notNull: true,
              }),
            },
          }),
        },
      })

      const result = postgresqlSchemaDiffDeparser(before, after)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(
        `"ALTER TABLE "users" RENAME TO "members";"`,
      )

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate COMMENT ON TABLE for table comment change', async () => {
      const before = aSchema({
        tables: {
          users: aTable({
            name: 'users',
            comment: 'Old comment',
            columns: {
              id: aColumn({
                name: 'id',
                type: 'bigint',
                notNull: true,
              }),
            },
          }),
        },
      })

      const after = aSchema({
        tables: {
          users: aTable({
            name: 'users',
            comment: 'New comment',
            columns: {
              id: aColumn({
                name: 'id',
                type: 'bigint',
                notNull: true,
              }),
            },
          }),
        },
      })

      const result = postgresqlSchemaDiffDeparser(before, after)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(
        `"COMMENT ON TABLE "users" IS 'New comment';"`,
      )

      await expectGeneratedSQLToBeParseable(result.value)
    })
  })

  describe('column operations', () => {
    it('should generate ADD COLUMN for added column', async () => {
      const before = aSchema({
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
        },
      })

      const after = aSchema({
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
          }),
        },
      })

      const result = postgresqlSchemaDiffDeparser(before, after)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(
        `"ALTER TABLE "users" ADD COLUMN "email" varchar(255) NOT NULL;"`,
      )

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate DROP COLUMN for removed column', async () => {
      const before = aSchema({
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
          }),
        },
      })

      const after = aSchema({
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
        },
      })

      const result = postgresqlSchemaDiffDeparser(before, after)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(
        `"ALTER TABLE "users" DROP COLUMN "email";"`,
      )

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate RENAME COLUMN for column name change', async () => {
      const before = aSchema({
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
          }),
        },
      })

      const after = aSchema({
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
                name: 'email_address',
                type: 'varchar(255)',
                notNull: true,
              }),
            },
          }),
        },
      })

      const result = postgresqlSchemaDiffDeparser(before, after)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(
        `"ALTER TABLE "users" RENAME COLUMN "email" TO "email_address";"`,
      )

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate ALTER COLUMN TYPE for column type change', async () => {
      const before = aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({
                name: 'id',
                type: 'integer',
                notNull: true,
              }),
            },
          }),
        },
      })

      const after = aSchema({
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
        },
      })

      const result = postgresqlSchemaDiffDeparser(before, after)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(
        `"ALTER TABLE "users" ALTER COLUMN "id" TYPE bigint;"`,
      )

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate ALTER COLUMN SET/DROP NOT NULL for notNull change', async () => {
      const before = aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              email: aColumn({
                name: 'email',
                type: 'varchar(255)',
                notNull: false,
              }),
            },
          }),
        },
      })

      const after = aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              email: aColumn({
                name: 'email',
                type: 'varchar(255)',
                notNull: true,
              }),
            },
          }),
        },
      })

      const result = postgresqlSchemaDiffDeparser(before, after)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(
        `"ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;"`,
      )

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate ALTER COLUMN SET/DROP DEFAULT for default value change', async () => {
      const before = aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              status: aColumn({
                name: 'status',
                type: 'varchar(50)',
                notNull: true,
                default: null,
              }),
            },
          }),
        },
      })

      const after = aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              status: aColumn({
                name: 'status',
                type: 'varchar(50)',
                notNull: true,
                default: 'active',
              }),
            },
          }),
        },
      })

      const result = postgresqlSchemaDiffDeparser(before, after)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(
        `"ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'active';"`,
      )

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate COMMENT ON COLUMN for column comment change', async () => {
      const before = aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({
                name: 'id',
                type: 'bigint',
                notNull: true,
                comment: 'Old comment',
              }),
            },
          }),
        },
      })

      const after = aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({
                name: 'id',
                type: 'bigint',
                notNull: true,
                comment: 'New comment',
              }),
            },
          }),
        },
      })

      const result = postgresqlSchemaDiffDeparser(before, after)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(
        `"COMMENT ON COLUMN "users"."id" IS 'New comment';"`,
      )

      await expectGeneratedSQLToBeParseable(result.value)
    })
  })

  describe('index operations', () => {
    it('should generate CREATE INDEX for added index', async () => {
      const before = aSchema({
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
            indexes: {},
          }),
        },
      })

      const after = aSchema({
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

      const result = postgresqlSchemaDiffDeparser(before, after)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(
        `"CREATE INDEX "idx_users_email" ON "users" USING BTREE ("email");"`,
      )

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate DROP INDEX for removed index', async () => {
      const before = aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
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

      const after = aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              email: aColumn({
                name: 'email',
                type: 'varchar(255)',
                notNull: true,
              }),
            },
            indexes: {},
          }),
        },
      })

      const result = postgresqlSchemaDiffDeparser(before, after)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(
        `"DROP INDEX "idx_users_email";"`,
      )

      await expectGeneratedSQLToBeParseable(result.value)
    })
  })

  describe('constraint operations', () => {
    it('should generate ADD CONSTRAINT for added constraint', async () => {
      const before = aSchema({
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
            constraints: {},
          }),
        },
      })

      const after = aSchema({
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
            constraints: {
              users_pkey: aPrimaryKeyConstraint({
                name: 'users_pkey',
                columnNames: ['id'],
              }),
            },
          }),
        },
      })

      const result = postgresqlSchemaDiffDeparser(before, after)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(
        `"ALTER TABLE "users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");"`,
      )

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate DROP CONSTRAINT for removed constraint', async () => {
      const before = aSchema({
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
            constraints: {
              users_pkey: aPrimaryKeyConstraint({
                name: 'users_pkey',
                columnNames: ['id'],
              }),
            },
          }),
        },
      })

      const after = aSchema({
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
            constraints: {},
          }),
        },
      })

      const result = postgresqlSchemaDiffDeparser(before, after)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(
        `"ALTER TABLE "users" DROP CONSTRAINT "users_pkey";"`,
      )

      await expectGeneratedSQLToBeParseable(result.value)
    })
  })

  describe('complex scenarios', () => {
    it('should handle multiple changes at once', async () => {
      const before = aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({
                name: 'id',
                type: 'integer',
                notNull: true,
              }),
            },
          }),
        },
      })

      const after = aSchema({
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
          products: aTable({
            name: 'products',
            columns: {
              id: aColumn({
                name: 'id',
                type: 'bigint',
                notNull: true,
              }),
            },
          }),
        },
      })

      const result = postgresqlSchemaDiffDeparser(before, after)

      expect(result.errors).toHaveLength(0)
      // Should contain multiple DDL statements
      expect(result.value).toContain('ALTER TABLE "users" ALTER COLUMN')
      expect(result.value).toContain('ALTER TABLE "users" ADD COLUMN')
      expect(result.value).toContain('CREATE INDEX')
      expect(result.value).toContain('CREATE TABLE "products"')

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should handle foreign key relationships', async () => {
      const before = aSchema({
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
            constraints: {},
          }),
        },
      })

      const after = aSchema({
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
              fk_orders_user: aForeignKeyConstraint({
                name: 'fk_orders_user',
                columnNames: ['user_id'],
                targetTableName: 'users',
                targetColumnNames: ['id'],
                updateConstraint: 'CASCADE',
                deleteConstraint: 'CASCADE',
              }),
            },
          }),
        },
      })

      const result = postgresqlSchemaDiffDeparser(before, after)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(
        `"ALTER TABLE "orders" ADD CONSTRAINT "fk_orders_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE CASCADE ON DELETE CASCADE;"`,
      )
    })
  })

  describe('empty changes', () => {
    it('should return empty string when schemas are identical', async () => {
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
        },
      })

      const result = postgresqlSchemaDiffDeparser(schema, schema)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toBe('')

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should return empty string when both schemas are empty', async () => {
      const emptySchema = aSchema({ tables: {} })

      const result = postgresqlSchemaDiffDeparser(emptySchema, emptySchema)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toBe('')

      await expectGeneratedSQLToBeParseable(result.value)
    })
  })
})
