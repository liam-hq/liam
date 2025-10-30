import { describe, expect, it } from 'vitest'
import type { MigrationOperation } from '../../migrationOperation/schema/index.js'
import { postgresqlMigrationOperationDeparser } from './migrationOperationDeparser.js'
import { expectGeneratedSQLToBeParseable } from './testUtils.js'

describe('postgresqlMigrationOperationDeparser', () => {
  describe('table operations', () => {
    it('should generate CREATE TABLE statement from add operation', async () => {
      const operation: MigrationOperation = {
        op: 'add',
        path: '/tables/users',
        value: {
          name: 'users',
          columns: {
            id: {
              name: 'id',
              type: 'bigint',
              notNull: true,
              default: null,
              check: null,
              comment: 'User ID',
            },
            email: {
              name: 'email',
              type: 'varchar(255)',
              notNull: true,
              default: null,
              check: null,
              comment: 'User email',
            },
          },
          comment: 'User table',
          indexes: {},
          constraints: {
            users_pkey: {
              type: 'PRIMARY KEY',
              name: 'users_pkey',
              columnNames: ['id'],
            },
          },
        },
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "CREATE TABLE "users" (
          "id" bigint NOT NULL,
          "email" varchar(255) NOT NULL
        );

        COMMENT ON TABLE "users" IS 'User table';
        COMMENT ON COLUMN "users"."id" IS 'User ID';
        COMMENT ON COLUMN "users"."email" IS 'User email';

        ALTER TABLE "users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate CREATE TABLE with default values', async () => {
      const operation: MigrationOperation = {
        op: 'add',
        path: '/tables/settings',
        value: {
          name: 'settings',
          columns: {
            id: {
              name: 'id',
              type: 'bigint',
              notNull: true,
              default: null,
              check: null,
              comment: null,
            },
            enabled: {
              name: 'enabled',
              type: 'boolean',
              notNull: true,
              default: true,
              check: null,
              comment: null,
            },
            title: {
              name: 'title',
              type: 'varchar(100)',
              notNull: false,
              default: 'Default Title',
              check: null,
              comment: null,
            },
          },
          comment: null,
          indexes: {},
          constraints: {
            settings_pkey: {
              type: 'PRIMARY KEY',
              name: 'settings_pkey',
              columnNames: ['id'],
            },
          },
        },
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "CREATE TABLE "settings" (
          "id" bigint NOT NULL,
          "enabled" boolean NOT NULL DEFAULT TRUE,
          "title" varchar(100) DEFAULT 'Default Title'
        );

        ALTER TABLE "settings" ADD CONSTRAINT "settings_pkey" PRIMARY KEY ("id");"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate DROP TABLE statement from remove operation', async () => {
      const operation: MigrationOperation = {
        op: 'remove',
        path: '/tables/users',
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "DROP TABLE "users";"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate RENAME TABLE statement from replace operation', async () => {
      const operation: MigrationOperation = {
        op: 'replace',
        path: '/tables/users/name',
        value: 'user_accounts',
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "ALTER TABLE "users" RENAME TO "user_accounts";"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })
  })

  describe('column operations', () => {
    it('should generate ADD COLUMN statement from add operation', async () => {
      const operation: MigrationOperation = {
        op: 'add',
        path: '/tables/users/columns/age',
        value: {
          name: 'age',
          type: 'integer',
          notNull: false,
          unique: false,
          default: null,
          check: null,
          comment: 'User age',
        },
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "ALTER TABLE "users" ADD COLUMN "age" integer;

        COMMENT ON COLUMN "users"."age" IS 'User age';"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate ADD COLUMN with constraints', async () => {
      const operation: MigrationOperation = {
        op: 'add',
        path: '/tables/products/columns/price',
        value: {
          name: 'price',
          type: 'decimal(10,2)',
          notNull: true,
          unique: false,
          default: 0.0,
          check: null,
          comment: null,
        },
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "ALTER TABLE "products" ADD COLUMN "price" decimal(10,2) NOT NULL DEFAULT 0;"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate DROP COLUMN statement from remove operation', async () => {
      const operation: MigrationOperation = {
        op: 'remove',
        path: '/tables/users/columns/age',
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "ALTER TABLE "users" DROP COLUMN "age";"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate RENAME COLUMN statement from replace operation', async () => {
      const operation: MigrationOperation = {
        op: 'replace',
        path: '/tables/users/columns/email/name',
        value: 'email_address',
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "ALTER TABLE "users" RENAME COLUMN "email" TO "email_address";"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate RENAME COLUMN for complex table and column names', async () => {
      const operation: MigrationOperation = {
        op: 'replace',
        path: '/tables/user_profiles/columns/first_name/name',
        value: 'given_name',
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "ALTER TABLE "user_profiles" RENAME COLUMN "first_name" TO "given_name";"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })
  })

  describe('index operations', () => {
    it('should generate CREATE INDEX statement from add operation', async () => {
      const operation: MigrationOperation = {
        op: 'add',
        path: '/tables/users/indexes/idx_users_email',
        value: {
          name: 'idx_users_email',
          unique: false,
          columns: ['email'],
          type: 'BTREE',
        },
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "CREATE INDEX "idx_users_email" ON "users" USING BTREE ("email");"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate CREATE UNIQUE INDEX statement', async () => {
      const operation: MigrationOperation = {
        op: 'add',
        path: '/tables/users/indexes/idx_users_username_unique',
        value: {
          name: 'idx_users_username_unique',
          unique: true,
          columns: ['username'],
          type: 'BTREE',
        },
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "CREATE UNIQUE INDEX "idx_users_username_unique" ON "users" USING BTREE ("username");"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate CREATE INDEX with multiple columns', async () => {
      const operation: MigrationOperation = {
        op: 'add',
        path: '/tables/orders/indexes/idx_orders_user_date',
        value: {
          name: 'idx_orders_user_date',
          unique: false,
          columns: ['user_id', 'created_at'],
          type: 'BTREE',
        },
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "CREATE INDEX "idx_orders_user_date" ON "orders" USING BTREE ("user_id", "created_at");"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate CREATE INDEX without index type', async () => {
      const operation: MigrationOperation = {
        op: 'add',
        path: '/tables/products/indexes/idx_products_category',
        value: {
          name: 'idx_products_category',
          unique: false,
          columns: ['category_id'],
          type: '',
        },
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "CREATE INDEX "idx_products_category" ON "products" ("category_id");"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate DROP INDEX statement from remove operation', async () => {
      const operation: MigrationOperation = {
        op: 'remove',
        path: '/tables/users/indexes/idx_users_email',
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "DROP INDEX "idx_users_email";"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate DROP INDEX for complex index name', async () => {
      const operation: MigrationOperation = {
        op: 'remove',
        path: '/tables/user_profiles/indexes/idx_user_profiles_email_unique',
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "DROP INDEX "idx_user_profiles_email_unique";"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })
  })

  describe('constraint operations', () => {
    it('should generate ADD CONSTRAINT PRIMARY KEY statement', async () => {
      const operation: MigrationOperation = {
        op: 'add',
        path: '/tables/users/constraints/pk_users_id',
        value: {
          type: 'PRIMARY KEY',
          name: 'pk_users_id',
          columnNames: ['id'],
        },
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "ALTER TABLE "users" ADD CONSTRAINT "pk_users_id" PRIMARY KEY ("id");"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate ADD CONSTRAINT FOREIGN KEY statement', async () => {
      const operation: MigrationOperation = {
        op: 'add',
        path: '/tables/orders/constraints/fk_orders_user_id',
        value: {
          type: 'FOREIGN KEY',
          name: 'fk_orders_user_id',
          columnNames: ['user_id'],
          targetTableName: 'users',
          targetColumnNames: ['id'],
          updateConstraint: 'CASCADE',
          deleteConstraint: 'SET_NULL',
        },
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "ALTER TABLE "orders" ADD CONSTRAINT "fk_orders_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE CASCADE ON DELETE SET NULL;"
      `)

      // Foreign key constraints require both source and target tables to exist for parsing
      // We need to create the referenced tables first to test the generated SQL
      const testSql = `
        CREATE TABLE "users" (id INTEGER PRIMARY KEY);
        CREATE TABLE "orders" (id INTEGER PRIMARY KEY, user_id INTEGER);
        ${result.value}
      `
      await expectGeneratedSQLToBeParseable(testSql)
    })

    it('should generate ADD CONSTRAINT UNIQUE statement', async () => {
      const operation: MigrationOperation = {
        op: 'add',
        path: '/tables/users/constraints/uk_users_email',
        value: {
          type: 'UNIQUE',
          name: 'uk_users_email',
          columnNames: ['email'],
        },
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "ALTER TABLE "users" ADD CONSTRAINT "uk_users_email" UNIQUE ("email");"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate ADD CONSTRAINT CHECK statement', async () => {
      const operation: MigrationOperation = {
        op: 'add',
        path: '/tables/products/constraints/ck_products_price_positive',
        value: {
          type: 'CHECK',
          name: 'ck_products_price_positive',
          detail: 'price > 0',
        },
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "ALTER TABLE "products" ADD CONSTRAINT "ck_products_price_positive" CHECK (price > 0);"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate DROP CONSTRAINT statement', async () => {
      const operation: MigrationOperation = {
        op: 'remove',
        path: '/tables/users/constraints/pk_users_id',
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "ALTER TABLE "users" DROP CONSTRAINT "pk_users_id";"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate DROP CONSTRAINT for complex constraint name', async () => {
      const operation: MigrationOperation = {
        op: 'remove',
        path: '/tables/orders/constraints/fk_orders_user_id',
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "ALTER TABLE "orders" DROP CONSTRAINT "fk_orders_user_id";"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate DROP CONSTRAINT for table with complex name', async () => {
      const operation: MigrationOperation = {
        op: 'remove',
        path: '/tables/user_profiles/constraints/uk_user_profiles_email',
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "ALTER TABLE "user_profiles" DROP CONSTRAINT "uk_user_profiles_email";"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })
  })

  describe('table comment operations', () => {
    it('should generate COMMENT ON TABLE statement', async () => {
      const operation: MigrationOperation = {
        op: 'replace',
        path: '/tables/users/comment',
        value: 'Updated user table comment',
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "COMMENT ON TABLE "users" IS 'Updated user table comment';"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate COMMENT ON TABLE IS NULL for null value', async () => {
      const operation: MigrationOperation = {
        op: 'replace',
        path: '/tables/users/comment',
        value: null,
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "COMMENT ON TABLE "users" IS NULL;"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })
  })

  describe('column type operations', () => {
    it('should generate ALTER COLUMN TYPE statement', async () => {
      const operation: MigrationOperation = {
        op: 'replace',
        path: '/tables/users/columns/email/type',
        value: 'text',
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "ALTER TABLE "users" ALTER COLUMN "email" TYPE text;"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })
  })

  describe('column comment operations', () => {
    it('should generate COMMENT ON COLUMN statement', async () => {
      const operation: MigrationOperation = {
        op: 'replace',
        path: '/tables/users/columns/email/comment',
        value: 'User email address',
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "COMMENT ON COLUMN "users"."email" IS 'User email address';"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate COMMENT ON COLUMN IS NULL for null value', async () => {
      const operation: MigrationOperation = {
        op: 'replace',
        path: '/tables/users/columns/email/comment',
        value: null,
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "COMMENT ON COLUMN "users"."email" IS NULL;"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })
  })

  describe('column notNull operations', () => {
    it('should generate ALTER COLUMN SET NOT NULL statement', async () => {
      const operation: MigrationOperation = {
        op: 'replace',
        path: '/tables/users/columns/email/notNull',
        value: true,
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate ALTER COLUMN DROP NOT NULL statement', async () => {
      const operation: MigrationOperation = {
        op: 'replace',
        path: '/tables/users/columns/email/notNull',
        value: false,
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })
  })

  describe('column default operations', () => {
    it('should generate ALTER COLUMN SET DEFAULT statement', async () => {
      const operation: MigrationOperation = {
        op: 'replace',
        path: '/tables/users/columns/status/default',
        value: 'active',
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'active';"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate ALTER COLUMN DROP DEFAULT statement for null', async () => {
      const operation: MigrationOperation = {
        op: 'replace',
        path: '/tables/users/columns/status/default',
        value: null,
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "ALTER TABLE "users" ALTER COLUMN "status" DROP DEFAULT;"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate ALTER COLUMN SET DEFAULT with function', async () => {
      const operation: MigrationOperation = {
        op: 'replace',
        path: '/tables/users/columns/created_at/default',
        value: 'now()',
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT now();"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should handle ALTER COLUMN SET DEFAULT for enum values', async () => {
      const operation: MigrationOperation = {
        op: 'replace',
        path: '/tables/users/columns/role/default',
        value: 'admin', // Unquoted enum value
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(
        `"ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'admin';"`,
      )

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should handle ALTER COLUMN SET DEFAULT for pre-quoted enum values', async () => {
      const operation: MigrationOperation = {
        op: 'replace',
        path: '/tables/users/columns/role/default',
        value: "'admin'", // Already quoted
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(
        `"ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'admin';"`,
      )

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should handle ALTER COLUMN SET DEFAULT for timestamptz functions', async () => {
      const operation: MigrationOperation = {
        op: 'replace',
        path: '/tables/events/columns/created_at/default',
        value: 'now()', // Function
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(
        `"ALTER TABLE "events" ALTER COLUMN "created_at" SET DEFAULT now();"`,
      )

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should handle ALTER COLUMN SET DEFAULT for timestamptz literals', async () => {
      const operation: MigrationOperation = {
        op: 'replace',
        path: '/tables/events/columns/scheduled_at/default',
        value: '2024-01-01 00:00:00+00', // Literal timestamp
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(
        `"ALTER TABLE "events" ALTER COLUMN "scheduled_at" SET DEFAULT '2024-01-01 00:00:00+00';"`,
      )

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should handle ALTER COLUMN SET DEFAULT for pre-quoted timestamptz', async () => {
      const operation: MigrationOperation = {
        op: 'replace',
        path: '/tables/events/columns/scheduled_at/default',
        value: "'2024-01-01 00:00:00+00'", // Already quoted
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(
        `"ALTER TABLE "events" ALTER COLUMN "scheduled_at" SET DEFAULT '2024-01-01 00:00:00+00';"`,
      )

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should handle ALTER COLUMN SET DEFAULT for cast expressions', async () => {
      const operation: MigrationOperation = {
        op: 'replace',
        path: '/tables/events/columns/created_at/default',
        value: "'2024-01-01'::timestamptz", // Cast expression
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(
        `"ALTER TABLE "events" ALTER COLUMN "created_at" SET DEFAULT '2024-01-01'::timestamptz;"`,
      )

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should handle ALTER COLUMN SET DEFAULT for enum cast expressions (issue #5684)', async () => {
      const operation: MigrationOperation = {
        op: 'replace',
        path: '/tables/users/columns/status/default',
        value: "'invited'::user_status", // Enum cast expression from issue #5684
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      // Should NOT produce '''invited''::user_status' with extra quotes
      expect(result.value).toMatchInlineSnapshot(
        `"ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'invited'::user_status;"`,
      )

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should handle ALTER COLUMN SET DEFAULT for INTERVAL expressions (issue #5702)', async () => {
      const operation: MigrationOperation = {
        op: 'replace',
        path: '/tables/subscriptions/columns/expires_at/default',
        value: "(now() + INTERVAL '30 days')", // INTERVAL expression from issue #5702
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      // Should NOT produce (now() + INTERVAL ''30 days'') with extra quotes
      expect(result.value).toMatchInlineSnapshot(
        `"ALTER TABLE "subscriptions" ALTER COLUMN "expires_at" SET DEFAULT (now() + INTERVAL '30 days');"`,
      )

      await expectGeneratedSQLToBeParseable(result.value)
    })
  })

  describe('column check operations', () => {
    it('should generate ADD CHECK CONSTRAINT statement', async () => {
      const operation: MigrationOperation = {
        op: 'replace',
        path: '/tables/products/columns/price/check',
        value: 'price > 0',
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "ALTER TABLE "products" ADD CONSTRAINT "products_price_check" CHECK (price > 0);"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate DROP CHECK CONSTRAINT statement for empty value', async () => {
      const operation: MigrationOperation = {
        op: 'replace',
        path: '/tables/products/columns/price/check',
        value: '',
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_price_check";"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })
  })

  describe('constraint action operations', () => {
    it('should return error for constraint delete action replacement', async () => {
      const operation: MigrationOperation = {
        op: 'replace',
        path: '/tables/orders/constraints/fk_orders_user_id/deleteConstraint',
        value: 'CASCADE',
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]?.message).toMatchInlineSnapshot(
        `"Altering constraint delete action is not directly supported. Drop and recreate the constraint."`,
      )
      expect(result.value).toBe('')
    })

    it('should return error for constraint update action replacement', async () => {
      const operation: MigrationOperation = {
        op: 'replace',
        path: '/tables/orders/constraints/fk_orders_user_id/updateConstraint',
        value: 'RESTRICT',
      }

      const result = postgresqlMigrationOperationDeparser(operation)

      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]?.message).toMatchInlineSnapshot(
        `"Altering constraint update action is not directly supported. Drop and recreate the constraint."`,
      )
      expect(result.value).toBe('')
    })
  })
})
