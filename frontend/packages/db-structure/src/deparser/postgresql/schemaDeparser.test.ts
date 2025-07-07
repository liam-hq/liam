import { describe, expect, it } from 'vitest'
import {
  aCheckConstraint,
  aColumn,
  aForeignKeyConstraint,
  anIndex,
  aPrimaryKeyConstraint,
  aSchema,
  aTable,
  aUniqueConstraint,
} from '../../schema/factories.js'
import { postgresqlSchemaDeparser } from './schemaDeparser.js'
import { expectGeneratedSQLToBeParseable } from './testUtils.js'

describe('postgresqlSchemaDeparser', () => {
  it('should generate basic CREATE TABLE statement', async () => {
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

    const result = postgresqlSchemaDeparser(schema)

    expect(result.errors).toHaveLength(0)
    expect(result.value).toMatchInlineSnapshot(`
      "CREATE TABLE "users" (
        "id" bigint NOT NULL,
        "email" varchar(255) NOT NULL
      );
      
      ALTER TABLE "users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");"
    `)

    await expectGeneratedSQLToBeParseable(result.value)
  })

  it('should generate CREATE TABLE with comments', async () => {
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

    const result = postgresqlSchemaDeparser(schema)

    expect(result.errors).toHaveLength(0)
    expect(result.value).toMatchInlineSnapshot(`
      "CREATE TABLE "products" (
        "id" bigint NOT NULL
      );

      COMMENT ON TABLE "products" IS 'Product table';
      COMMENT ON COLUMN "products"."id" IS 'Product ID';
      
      ALTER TABLE "products" ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");"
    `)

    await expectGeneratedSQLToBeParseable(result.value)
  })

  it('should generate CREATE TABLE with default values', async () => {
    const schema = aSchema({
      tables: {
        settings: aTable({
          name: 'settings',
          columns: {
            id: aColumn({
              name: 'id',
              type: 'bigint',
              notNull: true,
            }),
            enabled: aColumn({
              name: 'enabled',
              type: 'boolean',
              notNull: true,
              default: true,
            }),
            count: aColumn({ name: 'count', type: 'integer', default: 0 }),
            title: aColumn({
              name: 'title',
              type: 'varchar(50)',
              default: 'Default Title',
            }),
          },
          constraints: {
            settings_pkey: aPrimaryKeyConstraint({
              name: 'settings_pkey',
              columnNames: ['id'],
            }),
          },
        }),
      },
    })

    const result = postgresqlSchemaDeparser(schema)

    expect(result.errors).toHaveLength(0)
    expect(result.value).toMatchInlineSnapshot(`
      "CREATE TABLE "settings" (
        "id" bigint NOT NULL,
        "enabled" boolean NOT NULL DEFAULT TRUE,
        "count" integer DEFAULT 0,
        "title" varchar(50) DEFAULT 'Default Title'
      );
      
      ALTER TABLE "settings" ADD CONSTRAINT "settings_pkey" PRIMARY KEY ("id");"
    `)

    await expectGeneratedSQLToBeParseable(result.value)
  })

  it('should handle string escaping in comments', async () => {
    const schema = aSchema({
      tables: {
        test: aTable({
          name: 'test',
          comment: "Table with 'quotes' in comment",
          columns: {
            id: aColumn({
              name: 'id',
              type: 'bigint',
              notNull: true,
              comment: "Column with 'quotes' in comment",
            }),
          },
          constraints: {
            test_pkey: aPrimaryKeyConstraint({
              name: 'test_pkey',
              columnNames: ['id'],
            }),
          },
        }),
      },
    })

    const result = postgresqlSchemaDeparser(schema)

    expect(result.errors).toHaveLength(0)
    expect(result.value).toMatchInlineSnapshot(
      `
      "CREATE TABLE "test" (
        "id" bigint NOT NULL
      );

      COMMENT ON TABLE "test" IS 'Table with ''quotes'' in comment';
      COMMENT ON COLUMN "test"."id" IS 'Column with ''quotes'' in comment';
      
      ALTER TABLE "test" ADD CONSTRAINT "test_pkey" PRIMARY KEY ("id");"
    `,
    )

    await expectGeneratedSQLToBeParseable(result.value)
  })

  it('should handle multiple tables', async () => {
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
          constraints: {
            users_pkey: aPrimaryKeyConstraint({
              name: 'users_pkey',
              columnNames: ['id'],
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
          constraints: {
            products_pkey: aPrimaryKeyConstraint({
              name: 'products_pkey',
              columnNames: ['id'],
            }),
          },
        }),
      },
    })

    const result = postgresqlSchemaDeparser(schema)

    expect(result.errors).toHaveLength(0)
    expect(result.value).toMatchInlineSnapshot(`
      "CREATE TABLE "users" (
        "id" bigint NOT NULL
      );

      CREATE TABLE "products" (
        "id" bigint NOT NULL,
        "name" varchar(100) NOT NULL
      );
      
      ALTER TABLE "users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");
      
      ALTER TABLE "products" ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");"
    `)

    await expectGeneratedSQLToBeParseable(result.value)
  })

  it('should handle empty schema', async () => {
    const schema = aSchema({ tables: {} })

    const result = postgresqlSchemaDeparser(schema)

    expect(result.errors).toHaveLength(0)
    expect(result.value).toBe('')

    await expectGeneratedSQLToBeParseable(result.value)
  })

  describe('index generation', () => {
    it('should generate CREATE INDEX statements', async () => {
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

      const result = postgresqlSchemaDeparser(schema)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "CREATE TABLE \"users\" (
          \"id\" bigint NOT NULL,
          \"email\" varchar(255) NOT NULL
        );

        CREATE INDEX \"idx_users_email\" ON \"users\" USING BTREE (\"email\");"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate UNIQUE INDEX statements', async () => {
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
              username: aColumn({
                name: 'username',
                type: 'varchar(50)',
                notNull: true,
              }),
            },
            indexes: {
              idx_users_username_unique: anIndex({
                name: 'idx_users_username_unique',
                unique: true,
                columns: ['username'],
                type: 'BTREE',
              }),
            },
          }),
        },
      })

      const result = postgresqlSchemaDeparser(schema)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "CREATE TABLE \"users\" (
          \"id\" bigint NOT NULL,
          \"username\" varchar(50) NOT NULL
        );

        CREATE UNIQUE INDEX \"idx_users_username_unique\" ON \"users\" USING BTREE (\"username\");"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate composite INDEX statements', async () => {
      const schema = aSchema({
        tables: {
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
              created_at: aColumn({
                name: 'created_at',
                type: 'timestamp',
                notNull: true,
              }),
            },
            indexes: {
              idx_orders_user_date: anIndex({
                name: 'idx_orders_user_date',
                columns: ['user_id', 'created_at'],
                type: 'BTREE',
              }),
            },
          }),
        },
      })

      const result = postgresqlSchemaDeparser(schema)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "CREATE TABLE \"orders\" (
          \"id\" bigint NOT NULL,
          \"user_id\" bigint NOT NULL,
          \"created_at\" timestamp NOT NULL
        );

        CREATE INDEX \"idx_orders_user_date\" ON \"orders\" USING BTREE (\"user_id\", \"created_at\");"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should handle indexes without type specified', async () => {
      const schema = aSchema({
        tables: {
          products: aTable({
            name: 'products',
            columns: {
              id: aColumn({
                name: 'id',
                type: 'bigint',
                notNull: true,
              }),
              category_id: aColumn({ name: 'category_id', type: 'bigint' }),
            },
            indexes: {
              idx_products_category: anIndex({
                name: 'idx_products_category',
                columns: ['category_id'],
              }),
            },
          }),
        },
      })

      const result = postgresqlSchemaDeparser(schema)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "CREATE TABLE \"products\" (
          \"id\" bigint NOT NULL,
          \"category_id\" bigint
        );

        CREATE INDEX \"idx_products_category\" ON \"products\" (\"category_id\");"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })
  })

  describe('constraint generation', () => {
    it('should generate PRIMARY KEY constraints', async () => {
      const schema = aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({ name: 'id', type: 'bigint', notNull: true }),
            },
            constraints: {
              pk_users_id: aPrimaryKeyConstraint({
                name: 'pk_users_id',
                columnNames: ['id'],
              }),
            },
          }),
        },
      })

      const result = postgresqlSchemaDeparser(schema)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "CREATE TABLE \"users\" (
          \"id\" bigint NOT NULL
        );

        ALTER TABLE \"users\" ADD CONSTRAINT \"pk_users_id\" PRIMARY KEY (\"id\");"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate FOREIGN KEY constraints', async () => {
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
                columnName: 'user_id',
                targetTableName: 'users',
                targetColumnName: 'id',
                updateConstraint: 'CASCADE',
                deleteConstraint: 'SET_NULL',
              }),
            },
          }),
        },
      })

      const result = postgresqlSchemaDeparser(schema)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "CREATE TABLE \"users\" (
          \"id\" bigint NOT NULL
        );

        CREATE TABLE \"orders\" (
          \"id\" bigint NOT NULL,
          \"user_id\" bigint NOT NULL
        );

        ALTER TABLE \"orders\" ADD CONSTRAINT \"fk_orders_user_id\" FOREIGN KEY (\"user_id\") REFERENCES \"users\" (\"id\") ON UPDATE CASCADE ON DELETE SET NULL;"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate UNIQUE constraints', async () => {
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

      const result = postgresqlSchemaDeparser(schema)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "CREATE TABLE \"users\" (
          \"id\" bigint NOT NULL,
          \"email\" varchar(255) NOT NULL
        );

        ALTER TABLE \"users\" ADD CONSTRAINT \"uk_users_email\" UNIQUE (\"email\");"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should generate CHECK constraints', async () => {
      const schema = aSchema({
        tables: {
          products: aTable({
            name: 'products',
            columns: {
              id: aColumn({
                name: 'id',
                type: 'bigint',
                notNull: true,
              }),
              price: aColumn({
                name: 'price',
                type: 'decimal(10,2)',
                notNull: true,
              }),
            },
            constraints: {
              ck_products_price_positive: aCheckConstraint({
                name: 'ck_products_price_positive',
                detail: 'price > 0',
              }),
            },
          }),
        },
      })

      const result = postgresqlSchemaDeparser(schema)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "CREATE TABLE \"products\" (
          \"id\" bigint NOT NULL,
          \"price\" decimal(10,2) NOT NULL
        );

        ALTER TABLE \"products\" ADD CONSTRAINT \"ck_products_price_positive\" CHECK (price > 0);"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })
  })

  describe('complex schemas', () => {
    it('should handle schema with multiple tables, indexes, and constraints', async () => {
      const schema = aSchema({
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
              created_at: aColumn({
                name: 'created_at',
                type: 'timestamp',
                notNull: true,
                default: 'CURRENT_TIMESTAMP',
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
              price: aColumn({
                name: 'price',
                type: 'decimal(10,2)',
                notNull: true,
                default: 0,
              }),
            },
            indexes: {
              idx_products_name: anIndex({
                name: 'idx_products_name',
                columns: ['name'],
              }),
            },
            constraints: {
              ck_products_price: aCheckConstraint({
                name: 'ck_products_price',
                detail: 'price >= 0',
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
              product_id: aColumn({
                name: 'product_id',
                type: 'bigint',
                notNull: true,
              }),
              quantity: aColumn({
                name: 'quantity',
                type: 'integer',
                notNull: true,
                default: 1,
              }),
            },
            indexes: {
              idx_orders_user_product: anIndex({
                name: 'idx_orders_user_product',
                columns: ['user_id', 'product_id'],
                type: 'BTREE',
              }),
            },
            constraints: {
              fk_orders_user: aForeignKeyConstraint({
                name: 'fk_orders_user',
                columnName: 'user_id',
                targetTableName: 'users',
                targetColumnName: 'id',
                updateConstraint: 'CASCADE',
                deleteConstraint: 'CASCADE',
              }),
              fk_orders_product: aForeignKeyConstraint({
                name: 'fk_orders_product',
                columnName: 'product_id',
                targetTableName: 'products',
                targetColumnName: 'id',
                updateConstraint: 'CASCADE',
                deleteConstraint: 'RESTRICT',
              }),
            },
          }),
        },
      })

      const result = postgresqlSchemaDeparser(schema)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "CREATE TABLE "users" (
          "id" bigint NOT NULL,
          "email" varchar(255) NOT NULL,
          "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        COMMENT ON TABLE "users" IS 'Users table';
        COMMENT ON COLUMN "users"."id" IS 'User ID';

        CREATE TABLE "products" (
          "id" bigint NOT NULL,
          "name" varchar(100) NOT NULL,
          "price" decimal(10,2) NOT NULL DEFAULT 0
        );

        CREATE TABLE "orders" (
          "id" bigint NOT NULL,
          "user_id" bigint NOT NULL,
          "product_id" bigint NOT NULL,
          "quantity" integer NOT NULL DEFAULT 1
        );

        CREATE UNIQUE INDEX "idx_users_email" ON "users" USING BTREE ("email");

        CREATE INDEX "idx_products_name" ON "products" ("name");

        CREATE INDEX "idx_orders_user_product" ON "orders" USING BTREE ("user_id", "product_id");

        ALTER TABLE "products" ADD CONSTRAINT "ck_products_price" CHECK (price >= 0);

        ALTER TABLE "orders" ADD CONSTRAINT "fk_orders_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

        ALTER TABLE "orders" ADD CONSTRAINT "fk_orders_product" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })

    it('should handle circular foreign key references', async () => {
      const schema = aSchema({
        tables: {
          departments: aTable({
            name: 'departments',
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
              manager_id: aColumn({ name: 'manager_id', type: 'bigint' }),
            },
            constraints: {
              fk_departments_manager: aForeignKeyConstraint({
                name: 'fk_departments_manager',
                columnName: 'manager_id',
                targetTableName: 'employees',
                targetColumnName: 'id',
                updateConstraint: 'CASCADE',
                deleteConstraint: 'SET_NULL',
              }),
            },
          }),
          employees: aTable({
            name: 'employees',
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
              department_id: aColumn({
                name: 'department_id',
                type: 'bigint',
                notNull: true,
              }),
            },
            constraints: {
              fk_employees_department: aForeignKeyConstraint({
                name: 'fk_employees_department',
                columnName: 'department_id',
                targetTableName: 'departments',
                targetColumnName: 'id',
                updateConstraint: 'CASCADE',
                deleteConstraint: 'RESTRICT',
              }),
            },
          }),
        },
      })

      const result = postgresqlSchemaDeparser(schema)

      expect(result.errors).toHaveLength(0)
      expect(result.value).toMatchInlineSnapshot(`
        "CREATE TABLE \"departments\" (
          \"id\" bigint NOT NULL,
          \"name\" varchar(100) NOT NULL,
          \"manager_id\" bigint
        );

        CREATE TABLE \"employees\" (
          \"id\" bigint NOT NULL,
          \"name\" varchar(100) NOT NULL,
          \"department_id\" bigint NOT NULL
        );

        ALTER TABLE \"departments\" ADD CONSTRAINT \"fk_departments_manager\" FOREIGN KEY (\"manager_id\") REFERENCES \"employees\" (\"id\") ON UPDATE CASCADE ON DELETE SET NULL;

        ALTER TABLE \"employees\" ADD CONSTRAINT \"fk_employees_department\" FOREIGN KEY (\"department_id\") REFERENCES \"departments\" (\"id\") ON UPDATE CASCADE ON DELETE RESTRICT;"
      `)

      await expectGeneratedSQLToBeParseable(result.value)
    })
  })

  describe('error handling', () => {
    it('should handle empty table name', async () => {
      const schema = aSchema({
        tables: {
          '': aTable({
            name: '',
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

      const result = postgresqlSchemaDeparser(schema)

      // Empty table names are technically valid in PostgreSQL when escaped
      expect(result.errors).toHaveLength(0)
      expect(result.value).toContain('CREATE TABLE ""')
    })
  })

  describe('DDL Function Syntax', () => {
    describe('PostgreSQL function calls in default values', () => {
      it('should generate DDL with proper function syntax for UUIDs and timestamps', () => {
        const schema = aSchema({
          tables: {
            tasks: aTable({
              name: 'tasks',
              columns: {
                id: aColumn({
                  name: 'id',
                  type: 'uuid',
                  notNull: true,
                  default: 'gen_random_uuid()', // This should NOT be quoted in the DDL
                }),
                title: aColumn({
                  name: 'title',
                  type: 'text',
                  notNull: true,
                }),
                created_at: aColumn({
                  name: 'created_at',
                  type: 'timestamptz',
                  notNull: true,
                  default: 'now()', // This should NOT be quoted in the DDL
                }),
                updated_at: aColumn({
                  name: 'updated_at',
                  type: 'timestamptz',
                  notNull: true,
                  default: 'now()', // This should NOT be quoted in the DDL
                }),
              },
            }),
          },
        })

        const result = postgresqlSchemaDeparser(schema)

        expect(result.errors).toHaveLength(0)

        // Function calls should not be quoted
        expect(result.value).toContain('DEFAULT gen_random_uuid()')
        expect(result.value).not.toContain("DEFAULT 'gen_random_uuid()'")

        expect(result.value).toContain('DEFAULT now()')
        expect(result.value).not.toContain("DEFAULT 'now()'")

        // Should not contain any quoted function calls
        expect(result.value).not.toMatch(/'[a-zA-Z_][a-zA-Z0-9_]*\(\)'/g)
      })

      it('should handle string literals correctly (still quoted)', () => {
        const schema = aSchema({
          tables: {
            users: aTable({
              name: 'users',
              columns: {
                status: aColumn({
                  name: 'status',
                  type: 'varchar',
                  notNull: true,
                  default: 'active', // This SHOULD be quoted as it's a string literal
                }),
                role: aColumn({
                  name: 'role',
                  type: 'varchar',
                  notNull: true,
                  default: 'user', // This SHOULD be quoted as it's a string literal
                }),
              },
            }),
          },
        })

        const result = postgresqlSchemaDeparser(schema)

        expect(result.errors).toHaveLength(0)

        // String literals should still be quoted
        expect(result.value).toContain("DEFAULT 'active'")
        expect(result.value).toContain("DEFAULT 'user'")
      })

      it('should handle boolean and numeric defaults correctly', () => {
        const schema = aSchema({
          tables: {
            settings: aTable({
              name: 'settings',
              columns: {
                enabled: aColumn({
                  name: 'enabled',
                  type: 'boolean',
                  notNull: true,
                  default: false, // Boolean should not be quoted
                }),
                count: aColumn({
                  name: 'count',
                  type: 'integer',
                  notNull: true,
                  default: 0, // Number should not be quoted
                }),
              },
            }),
          },
        })

        const result = postgresqlSchemaDeparser(schema)

        expect(result.errors).toHaveLength(0)

        // Boolean and numeric defaults should not be quoted
        expect(result.value).toContain('DEFAULT FALSE')
        expect(result.value).toContain('DEFAULT 0')
        expect(result.value).not.toContain("DEFAULT 'FALSE'")
        expect(result.value).not.toContain("DEFAULT '0'")
      })

      it('should handle various PostgreSQL function calls correctly', () => {
        const schema = aSchema({
          tables: {
            logs: aTable({
              name: 'logs',
              columns: {
                timestamp_col: aColumn({
                  name: 'timestamp_col',
                  type: 'timestamptz',
                  notNull: true,
                  default: 'current_timestamp', // Function without parentheses
                }),
                random_val: aColumn({
                  name: 'random_val',
                  type: 'float',
                  notNull: true,
                  default: 'random()', // Function with parentheses
                }),
                date_col: aColumn({
                  name: 'date_col',
                  type: 'date',
                  notNull: true,
                  default: 'current_date', // Function without parentheses
                }),
              },
            }),
          },
        })

        const result = postgresqlSchemaDeparser(schema)

        expect(result.errors).toHaveLength(0)

        // Function calls should not be quoted
        expect(result.value).toContain('DEFAULT current_timestamp')
        expect(result.value).toContain('DEFAULT random()')
        expect(result.value).toContain('DEFAULT current_date')

        // Should not contain quoted versions
        expect(result.value).not.toContain("DEFAULT 'current_timestamp'")
        expect(result.value).not.toContain("DEFAULT 'random()'")
        expect(result.value).not.toContain("DEFAULT 'current_date'")
      })

      it('should handle complex function calls with arguments', () => {
        const schema = aSchema({
          tables: {
            analytics: aTable({
              name: 'analytics',
              columns: {
                timestamp_col: aColumn({
                  name: 'timestamp_col',
                  type: 'timestamptz',
                  notNull: true,
                  default: 'extract(epoch from now())', // Function with nested function call
                }),
                age_col: aColumn({
                  name: 'age_col',
                  type: 'interval',
                  notNull: true,
                  default: 'age(current_date)', // Function with argument
                }),
                truncated_date: aColumn({
                  name: 'truncated_date',
                  type: 'date',
                  notNull: true,
                  default: "date_trunc('day', now())", // Function with quoted argument
                }),
              },
            }),
          },
        })

        const result = postgresqlSchemaDeparser(schema)

        expect(result.errors).toHaveLength(0)

        // Complex function calls should not be quoted
        expect(result.value).toContain('DEFAULT extract(epoch from now())')
        expect(result.value).toContain('DEFAULT age(current_date)')
        expect(result.value).toContain("DEFAULT date_trunc('day', now())")

        // Should not contain quoted versions
        expect(result.value).not.toContain(
          "DEFAULT 'extract(epoch from now())'",
        )
        expect(result.value).not.toContain("DEFAULT 'age(current_date)'")
        expect(result.value).not.toContain(
          "DEFAULT 'date_trunc(\\'day\\', now())'",
        )
      })

      it('should handle UUID generation functions correctly', () => {
        const schema = aSchema({
          tables: {
            entities: aTable({
              name: 'entities',
              columns: {
                id_v4: aColumn({
                  name: 'id_v4',
                  type: 'uuid',
                  notNull: true,
                  default: 'uuid_generate_v4()', // UUID extension function
                }),
                id_v1: aColumn({
                  name: 'id_v1',
                  type: 'uuid',
                  notNull: true,
                  default: 'uuid_generate_v1()', // UUID extension function
                }),
                id_gen_random: aColumn({
                  name: 'id_gen_random',
                  type: 'uuid',
                  notNull: true,
                  default: 'gen_random_uuid()', // Built-in function
                }),
              },
            }),
          },
        })

        const result = postgresqlSchemaDeparser(schema)

        expect(result.errors).toHaveLength(0)

        // UUID functions should not be quoted
        expect(result.value).toContain('DEFAULT uuid_generate_v4()')
        expect(result.value).toContain('DEFAULT uuid_generate_v1()')
        expect(result.value).toContain('DEFAULT gen_random_uuid()')

        // Should not contain quoted versions
        expect(result.value).not.toContain("DEFAULT 'uuid_generate_v4()'")
        expect(result.value).not.toContain("DEFAULT 'uuid_generate_v1()'")
        expect(result.value).not.toContain("DEFAULT 'gen_random_uuid()'")
      })

      it('should handle mathematical functions correctly', () => {
        const schema = aSchema({
          tables: {
            calculations: aTable({
              name: 'calculations',
              columns: {
                random_number: aColumn({
                  name: 'random_number',
                  type: 'float',
                  notNull: true,
                  default: 'random()', // Random function
                }),
                floor_value: aColumn({
                  name: 'floor_value',
                  type: 'integer',
                  notNull: true,
                  default: 'floor(random() * 100)', // Floor function with expression
                }),
                ceiling_value: aColumn({
                  name: 'ceiling_value',
                  type: 'integer',
                  notNull: true,
                  default: 'ceil(random() * 100)', // Ceiling function with expression
                }),
                rounded_value: aColumn({
                  name: 'rounded_value',
                  type: 'numeric',
                  notNull: true,
                  default: 'round(random() * 100, 2)', // Round function with precision
                }),
              },
            }),
          },
        })

        const result = postgresqlSchemaDeparser(schema)

        expect(result.errors).toHaveLength(0)

        // Mathematical functions should not be quoted
        expect(result.value).toContain('DEFAULT random()')
        expect(result.value).toContain('DEFAULT floor(random() * 100)')
        expect(result.value).toContain('DEFAULT ceil(random() * 100)')
        expect(result.value).toContain('DEFAULT round(random() * 100, 2)')

        // Should not contain quoted versions
        expect(result.value).not.toContain("DEFAULT 'random()'")
        expect(result.value).not.toContain("DEFAULT 'floor(random() * 100)'")
        expect(result.value).not.toContain("DEFAULT 'ceil(random() * 100)'")
        expect(result.value).not.toContain("DEFAULT 'round(random() * 100, 2)'")
      })

      it('should handle mixed default types correctly', () => {
        const schema = aSchema({
          tables: {
            mixed_defaults: aTable({
              name: 'mixed_defaults',
              columns: {
                id: aColumn({
                  name: 'id',
                  type: 'uuid',
                  notNull: true,
                  default: 'gen_random_uuid()', // Function - should not be quoted
                }),
                status: aColumn({
                  name: 'status',
                  type: 'varchar',
                  notNull: true,
                  default: 'pending', // String literal - should be quoted
                }),
                is_active: aColumn({
                  name: 'is_active',
                  type: 'boolean',
                  notNull: true,
                  default: true, // Boolean - should not be quoted
                }),
                count: aColumn({
                  name: 'count',
                  type: 'integer',
                  notNull: true,
                  default: 0, // Number - should not be quoted
                }),
                created_at: aColumn({
                  name: 'created_at',
                  type: 'timestamptz',
                  notNull: true,
                  default: 'now()', // Function - should not be quoted
                }),
              },
            }),
          },
        })

        const result = postgresqlSchemaDeparser(schema)

        expect(result.errors).toHaveLength(0)

        // Functions should not be quoted
        expect(result.value).toContain('DEFAULT gen_random_uuid()')
        expect(result.value).toContain('DEFAULT now()')

        // String literals should be quoted
        expect(result.value).toContain("DEFAULT 'pending'")

        // Boolean and numeric values should not be quoted
        expect(result.value).toContain('DEFAULT TRUE')
        expect(result.value).toContain('DEFAULT 0')

        // Ensure functions are not quoted
        expect(result.value).not.toContain("DEFAULT 'gen_random_uuid()'")
        expect(result.value).not.toContain("DEFAULT 'now()'")
      })
    })
  })
})
