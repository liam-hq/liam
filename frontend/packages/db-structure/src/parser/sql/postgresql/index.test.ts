import { describe, expect, it } from 'vitest'
import type { Table } from '../../../schema/index.js'
import { aColumn, aSchema, aTable } from '../../../schema/index.js'
import { createParserTestCases } from '../../__tests__/index.js'
import { UnexpectedTokenWarningError } from '../../errors.js'
import { processor } from './index.js'

describe(processor, () => {
  const userTable = (override?: Partial<Table>) =>
    aSchema({
      tables: {
        users: aTable({
          name: 'users',
          columns: {
            id: aColumn({
              name: 'id',
              type: 'bigserial',
              notNull: true,
            }),
            ...override?.columns,
          },
          indexes: {
            ...override?.indexes,
          },
          comment: override?.comment ?? null,
          constraints: {
            ...override?.constraints,
            PRIMARY_id: {
              name: 'PRIMARY_id',
              type: 'PRIMARY KEY',
              columnNames: ['id'],
            },
          },
        }),
      },
    })
  const parserTestCases = createParserTestCases(userTable)

  describe('should parse CREATE TABLE statement correctly', () => {
    it('table comment', async () => {
      const { value } = await processor(/* sql */ `
        CREATE TABLE users (
          id BIGSERIAL PRIMARY KEY
        );
        COMMENT ON TABLE users IS 'store our users.';
      `)

      expect(value).toEqual(parserTestCases['table comment'])
    })

    it('column commnet', async () => {
      const { value } = await processor(/* sql */ `
        CREATE TABLE users (
          id BIGSERIAL PRIMARY KEY,
          description TEXT
        );
        COMMENT ON COLUMN users.description IS 'this is description';
      `)

      expect(value).toEqual(parserTestCases['column comment'])
    })

    it('not null', async () => {
      const { value } = await processor(/* sql */ `
        CREATE TABLE users (
          id BIGSERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL
        );
      `)

      expect(value).toEqual(parserTestCases['not null'])
    })

    it('nullable', async () => {
      const { value } = await processor(/* sql */ `
        CREATE TABLE users (
          id BIGSERIAL PRIMARY KEY,
          description TEXT
        );
      `)

      expect(value).toEqual(parserTestCases.nullable)
    })

    it('default value as string', async () => {
      const { value } = await processor(/* sql */ `
        CREATE TABLE users (
          id BIGSERIAL PRIMARY KEY,
          description TEXT DEFAULT 'user''s description'
        );
      `)

      expect(value).toEqual(parserTestCases['default value as string'])
    })

    it('default value as integer', async () => {
      const { value } = await processor(/* sql */ `
        CREATE TABLE users (
          id BIGSERIAL PRIMARY KEY,
          age INTEGER DEFAULT 30
        );
      `)

      expect(value).toEqual(parserTestCases['default value as integer'])
    })

    it('default value as boolean', async () => {
      const { value } = await processor(/* sql */ `
        CREATE TABLE users (
          id BIGSERIAL PRIMARY KEY,
          active BOOLEAN DEFAULT TRUE
        );
      `)

      expect(value).toEqual(parserTestCases['default value as boolean'])
    })

    it('unique', async () => {
      const { value } = await processor(/* sql */ `
        CREATE TABLE users (
          id BIGSERIAL PRIMARY KEY,
          mention TEXT UNIQUE
        );
      `)

      expect(value).toEqual(
        userTable({
          columns: {
            mention: aColumn({
              name: 'mention',
              type: 'text',
            }),
          },
          constraints: {
            UNIQUE_mention: {
              name: 'UNIQUE_mention',
              type: 'UNIQUE',
              columnNames: ['mention'],
            },
          },
        }),
      )
    })

    it('index (unique: false)', async () => {
      const indexName = 'index_users_on_id_and_email'
      const { value } = await processor(/* sql */ `
        CREATE TABLE users (
          id BIGSERIAL PRIMARY KEY,
          email VARCHAR(255)
        );

        CREATE INDEX index_users_on_id_and_email ON public.users USING btree (id, email);
      `)

      expect(value).toEqual(
        parserTestCases['index (unique: false)'](indexName, 'btree'),
      )
    })

    it('index (unique: true)', async () => {
      const { value } = await processor(/* sql */ `
        CREATE TABLE users (
          id BIGSERIAL PRIMARY KEY,
          email VARCHAR(255)
        );

        CREATE UNIQUE INDEX index_users_on_email ON public.users USING btree (email);
      `)

      expect(value).toEqual(parserTestCases['index (unique: true)']('btree'))
    })

    it('table-level primary key constraint with named constraint', async () => {
      const { value } = await processor(/* sql */ `
        CREATE TABLE bar (
          bar_id int,
          name text NOT NULL,
          CONSTRAINT bar_primary_key PRIMARY KEY (bar_id)
        );
      `)

      expect(value.tables['bar']?.constraints).toEqual({
        bar_primary_key: {
          name: 'bar_primary_key',
          type: 'PRIMARY KEY',
          columnNames: ['bar_id'],
        },
      })
    })

    it('table-level primary key constraint without named constraint', async () => {
      const { value } = await processor(/* sql */ `
        CREATE TABLE foo_bar (
          foo_id int,
          bar_id int,
          PRIMARY KEY (foo_id, bar_id)
        );
      `)

      expect(value.tables['foo_bar']?.constraints).toEqual({
        foo_bar_pkey: {
          name: 'foo_bar_pkey',
          type: 'PRIMARY KEY',
          columnNames: ['foo_id', 'bar_id'],
        },
      })
    })

    it('table-level single column primary key constraint', async () => {
      const { value } = await processor(/* sql */ `
        CREATE TABLE baz (
          baz_id int,
          name text,
          PRIMARY KEY (baz_id)
        );
      `)

      expect(value.tables['baz']?.constraints).toEqual({
        baz_pkey: {
          name: 'baz_pkey',
          type: 'PRIMARY KEY',
          columnNames: ['baz_id'],
        },
      })
    })

    it('foreign key constraint in CREATE TABLE', async () => {
      const { value } = await processor(/* sql */ `
        CREATE TABLE posts (
          id BIGSERIAL PRIMARY KEY,
          user_id INT,
          CONSTRAINT fk_posts_user_id FOREIGN KEY (user_id) REFERENCES users(id)
        );
      `)

      expect(value.tables['posts']?.constraints).toEqual({
        PRIMARY_id: {
          name: 'PRIMARY_id',
          type: 'PRIMARY KEY',
          columnNames: ['id'],
        },
        fk_posts_user_id: {
          name: 'fk_posts_user_id',
          type: 'FOREIGN KEY',
          columnNames: ['user_id'],
          targetTableName: 'users',
          targetColumnNames: ['id'],
          updateConstraint: 'NO_ACTION',
          deleteConstraint: 'NO_ACTION',
        },
      })
    })

    it('foreign key with omit key name', async () => {
      const { value } = await processor(/* sql */ `
        CREATE TABLE posts (
          id BIGSERIAL PRIMARY KEY,
          user_id INT REFERENCES users(id)
        );
      `)

      // TODO: This test demonstrates the current behavior where we use defaultRelationshipName
      // instead of PostgreSQL's standard naming convention.
      //
      // Current behavior: 'users_id_to_posts_user_id' (using defaultRelationshipName)
      // Ideal behavior: 'posts_user_id_fkey' (PostgreSQL standard)
      //
      // PostgreSQL automatically generates constraint names in the format:
      // <table>_<column>_fkey when no explicit name is provided.
      //
      // We should consider migrating to PostgreSQL's standard naming convention
      // in a future major version to better reflect actual database behavior.
      expect(value.tables['posts']?.constraints).toEqual({
        PRIMARY_id: {
          name: 'PRIMARY_id',
          type: 'PRIMARY KEY',
          columnNames: ['id'],
        },
        users_id_to_posts_user_id: {
          name: 'users_id_to_posts_user_id',
          type: 'FOREIGN KEY',
          columnNames: ['user_id'],
          targetColumnNames: ['id'],
          targetTableName: 'users',
          updateConstraint: 'NO_ACTION',
          deleteConstraint: 'NO_ACTION',
        },
      })
    })

    it('foreign key constraint (one-to-one)', async () => {
      const { value } = await processor(/* sql */ `
        CREATE TABLE posts (
          id BIGSERIAL PRIMARY KEY,
          user_id INT REFERENCES users(id) UNIQUE
        );
      `)

      expect(value.tables['posts']?.constraints).toEqual({
        PRIMARY_id: {
          name: 'PRIMARY_id',
          type: 'PRIMARY KEY',
          columnNames: ['id'],
        },
        UNIQUE_user_id: {
          name: 'UNIQUE_user_id',
          type: 'UNIQUE',
          columnNames: ['user_id'],
        },
        users_id_to_posts_user_id: {
          name: 'users_id_to_posts_user_id',
          type: 'FOREIGN KEY',
          columnNames: ['user_id'],
          targetColumnNames: ['id'],
          targetTableName: 'users',
          updateConstraint: 'NO_ACTION',
          deleteConstraint: 'NO_ACTION',
        },
      })
    })

    it('check constraint', async () => {
      const { value } = await processor(/* sql */ `
        CREATE TABLE products (
            id SERIAL PRIMARY KEY,
            name text,
            price numeric CHECK (price > 0)
        );
      `)

      expect(value.tables['products']?.constraints).toEqual({
        PRIMARY_id: {
          name: 'PRIMARY_id',
          type: 'PRIMARY KEY',
          columnNames: ['id'],
        },
        CHECK_price: {
          name: 'CHECK_price',
          type: 'CHECK',
          detail: 'CHECK (price > 0)',
        },
      })
    })

    it('table-level unique constraint', async () => {
      const { value } = await processor(/* sql */ `
        CREATE TABLE user_roles (
          user_id INT NOT NULL,
          role_id INT NOT NULL,
          CONSTRAINT unique_user_role UNIQUE (user_id, role_id)
        );
      `)

      expect(value.tables['user_roles']?.constraints).toEqual({
        unique_user_role: {
          name: 'unique_user_role',
          type: 'UNIQUE',
          columnNames: ['user_id', 'role_id'],
        },
      })
    })
  })

  describe('should parse ALTER TABLE statement correctly', () => {
    it('foreign key constraint (one-to-many)', async () => {
      const keyName = 'fk_posts_user_id'
      const { value } = await processor(/* sql */ `
        CREATE TABLE posts (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL
        );

        ALTER TABLE posts
        ADD CONSTRAINT ${keyName} FOREIGN KEY (user_id) REFERENCES users(id);
      `)

      expect(value.tables['posts']?.constraints).toEqual({
        PRIMARY_id: {
          name: 'PRIMARY_id',
          type: 'PRIMARY KEY',
          columnNames: ['id'],
        },
        fk_posts_user_id: {
          name: 'fk_posts_user_id',
          type: 'FOREIGN KEY',
          columnNames: ['user_id'],
          targetTableName: 'users',
          targetColumnNames: ['id'],
          updateConstraint: 'NO_ACTION',
          deleteConstraint: 'NO_ACTION',
        },
      })
    })

    it('foreign key constraint (one-to-one)', async () => {
      const { value } = await processor(/* sql */ `
        CREATE TABLE posts (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL UNIQUE
        );

        ALTER TABLE posts
        ADD CONSTRAINT users_id_to_posts_user_id FOREIGN KEY (user_id) REFERENCES users(id);
      `)

      expect(value.tables['posts']?.constraints).toEqual({
        PRIMARY_id: {
          name: 'PRIMARY_id',
          type: 'PRIMARY KEY',
          columnNames: ['id'],
        },
        UNIQUE_user_id: {
          name: 'UNIQUE_user_id',
          type: 'UNIQUE',
          columnNames: ['user_id'],
        },
        users_id_to_posts_user_id: {
          name: 'users_id_to_posts_user_id',
          type: 'FOREIGN KEY',
          columnNames: ['user_id'],
          targetTableName: 'users',
          targetColumnNames: ['id'],
          updateConstraint: 'NO_ACTION',
          deleteConstraint: 'NO_ACTION',
        },
      })
    })

    it('foreign key with action', async () => {
      const { value } = await processor(/* sql */ `
        CREATE TABLE posts (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL
        );

        ALTER TABLE posts
        ADD CONSTRAINT fk_posts_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE CASCADE;
      `)

      expect(value.tables['posts']?.constraints).toEqual({
        PRIMARY_id: {
          name: 'PRIMARY_id',
          type: 'PRIMARY KEY',
          columnNames: ['id'],
        },
        fk_posts_user_id: {
          name: 'fk_posts_user_id',
          type: 'FOREIGN KEY',
          columnNames: ['user_id'],
          targetTableName: 'users',
          targetColumnNames: ['id'],
          updateConstraint: 'RESTRICT',
          deleteConstraint: 'CASCADE',
        },
      })
    })

    it('check constraint', async () => {
      const { value } = await processor(/* sql */ `
        CREATE TABLE products (
            id SERIAL PRIMARY KEY,
            name text,
            price numeric
        );

        ALTER TABLE products
        ADD CONSTRAINT price_check_is_positive CHECK (price > 0);
      `)

      expect(value.tables['products']?.constraints).toEqual({
        PRIMARY_id: {
          name: 'PRIMARY_id',
          type: 'PRIMARY KEY',
          columnNames: ['id'],
        },
        price_check_is_positive: {
          name: 'price_check_is_positive',
          type: 'CHECK',
          detail: 'CHECK (price > 0)',
        },
      })
    })
  })

  describe('abnormal cases', () => {
    it('show error if the syntax is broken', async () => {
      const result = await processor(/* sql */ `
        CREATEe TABLE posts ();
      `)

      const value = { tables: {} }
      const errors = [
        new UnexpectedTokenWarningError('syntax error at or near "CREATEe"'),
      ]

      expect(result).toEqual({ value, errors })
    })
  })

  describe('Long "create table" statement (surpassing CHUNK_SIZE). regression test for liam-hq/liam#874', () => {
    // Use smaller chunkSize for faster testing
    const testChunkSize = 10

    it('parses without errors', async () => {
      const linePaddingForTest = '\n'.repeat(testChunkSize)
      const { value, errors } = await processor(
        /* sql */ `
        CREATE TABLE users (
          id BIGSERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL
          ${linePaddingForTest}
        );
      `,
        testChunkSize,
      )

      expect(value).toEqual(parserTestCases.normal)
      expect(errors).toEqual([])
    })
  })

  describe('Long "create function" statement (surpassing CHUNK_SIZE). regression test for liam-hq/liam#874', () => {
    // Use smaller chunkSize for faster testing
    const testChunkSize = 10

    it('parses without errors', async () => {
      const linePaddingForTest = '\n'.repeat(testChunkSize)
      const { value, errors } = await processor(
        /* sql */ `
        CREATE TABLE users (
          id BIGSERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL
        );

        CREATE OR REPLACE FUNCTION test_proc(p_id integer)
        RETURNS void AS $$
        BEGIN
            RAISE NOTICE 'Stored procedure called with parameter: %', p_id;
            ${linePaddingForTest}
        END;
        $$ LANGUAGE plpgsql;
      `,
        testChunkSize,
      )
      expect(value).toEqual(parserTestCases.normal)
      expect(errors).toEqual([])
    })
  })

  describe('Composite foreign keys', () => {
    it('should parse composite foreign key constraints', async () => {
      const { value } = await processor(/* sql */ `
        -- Create tables with composite primary keys
        CREATE TABLE regions (
          country_code VARCHAR(2),
          region_code VARCHAR(10),
          region_name VARCHAR(100),
          PRIMARY KEY (country_code, region_code)
        );

        CREATE TABLE stores (
          store_id SERIAL PRIMARY KEY,
          country_code VARCHAR(2),
          region_code VARCHAR(10),
          store_name VARCHAR(100),
          CONSTRAINT fk_store_region FOREIGN KEY (country_code, region_code) 
            REFERENCES regions(country_code, region_code) ON DELETE CASCADE
        );

        CREATE TABLE store_employees (
          employee_id SERIAL PRIMARY KEY,
          country_code VARCHAR(2),
          region_code VARCHAR(10),
          employee_name VARCHAR(100),
          hire_date DATE
        );

        -- Add composite foreign key using ALTER TABLE
        ALTER TABLE store_employees
          ADD CONSTRAINT fk_employee_region 
          FOREIGN KEY (country_code, region_code) 
          REFERENCES regions(country_code, region_code);
      `)

      // Expected: Composite foreign keys should include all columns
      expect(value.tables['regions']?.constraints).toEqual({
        regions_pkey: {
          name: 'regions_pkey',
          type: 'PRIMARY KEY',
          columnNames: ['country_code', 'region_code'],
        },
      })

      // Currently this will fail because foreign keys only support single columns
      // The expected behavior would be:
      expect(value.tables['stores']?.constraints).toEqual({
        PRIMARY_store_id: {
          name: 'PRIMARY_store_id',
          type: 'PRIMARY KEY',
          columnNames: ['store_id'],
        },
        fk_store_region: {
          name: 'fk_store_region',
          type: 'FOREIGN KEY',
          columnNames: ['country_code', 'region_code'], // Should be array
          targetTableName: 'regions',
          targetColumnNames: ['country_code', 'region_code'], // Should be array
          updateConstraint: 'NO_ACTION',
          deleteConstraint: 'CASCADE',
        },
      })

      expect(value.tables['store_employees']?.constraints).toEqual({
        PRIMARY_employee_id: {
          name: 'PRIMARY_employee_id',
          type: 'PRIMARY KEY',
          columnNames: ['employee_id'],
        },
        fk_employee_region: {
          name: 'fk_employee_region',
          type: 'FOREIGN KEY',
          columnNames: ['country_code', 'region_code'], // Should be array
          targetTableName: 'regions',
          targetColumnNames: ['country_code', 'region_code'], // Should be array
          updateConstraint: 'NO_ACTION',
          deleteConstraint: 'NO_ACTION',
        },
      })
    })

    it('should handle composite foreign keys with mixed constraints', async () => {
      const { value } = await processor(/* sql */ `
        -- Time-series data with composite keys
        CREATE TABLE metrics (
          metric_type VARCHAR(50),
          timestamp TIMESTAMPTZ,
          value NUMERIC,
          PRIMARY KEY (metric_type, timestamp)
        );

        CREATE TABLE metric_aggregations (
          agg_id SERIAL PRIMARY KEY,
          metric_type VARCHAR(50),
          timestamp TIMESTAMPTZ,
          hour_avg NUMERIC,
          UNIQUE (metric_type, timestamp),
          CONSTRAINT fk_metric_agg 
            FOREIGN KEY (metric_type, timestamp) 
            REFERENCES metrics(metric_type, timestamp) ON UPDATE CASCADE ON DELETE CASCADE
        );
      `)

      expect(value.tables['metric_aggregations']?.constraints).toEqual({
        PRIMARY_agg_id: {
          name: 'PRIMARY_agg_id',
          type: 'PRIMARY KEY',
          columnNames: ['agg_id'],
        },
        metric_aggregations_metric_type_timestamp_key: {
          name: 'metric_aggregations_metric_type_timestamp_key',
          type: 'UNIQUE',
          columnNames: ['metric_type', 'timestamp'],
        },
        fk_metric_agg: {
          name: 'fk_metric_agg',
          type: 'FOREIGN KEY',
          columnNames: ['metric_type', 'timestamp'], // Should be array
          targetTableName: 'metrics',
          targetColumnNames: ['metric_type', 'timestamp'], // Should be array
          updateConstraint: 'CASCADE',
          deleteConstraint: 'CASCADE',
        },
      })
    })
  })

  describe('Schema-qualified table names with foreign keys', () => {
    it('should parse foreign key constraints with schema-qualified table names', async () => {
      const { value } = await processor(/* sql */ `
        -- Create schemas
        CREATE SCHEMA auth;
        CREATE SCHEMA analytics;
        CREATE SCHEMA ecommerce;

        -- Create tables in different schemas
        CREATE TABLE auth.users (
          user_id uuid PRIMARY KEY,
          email varchar(255) NOT NULL
        );

        CREATE TABLE analytics.page_views (
          view_id bigint PRIMARY KEY,
          user_id uuid,
          page_url text NOT NULL
        );

        CREATE TABLE ecommerce.products (
          product_id uuid PRIMARY KEY,
          product_name varchar(255) NOT NULL,
          created_by uuid
        );

        -- Add foreign key constraints with schema-qualified references (using ONLY keyword like pg_dump)
        ALTER TABLE ONLY analytics.page_views
          ADD CONSTRAINT fk_page_view_user 
          FOREIGN KEY (user_id) REFERENCES auth.users(user_id) ON DELETE SET NULL;

        ALTER TABLE ONLY ecommerce.products
          ADD CONSTRAINT fk_product_creator 
          FOREIGN KEY (created_by) REFERENCES auth.users(user_id) ON DELETE SET NULL;
      `)

      // Expected: Both foreign key constraints should be parsed correctly
      expect(value.tables['page_views']?.constraints).toEqual({
        PRIMARY_view_id: {
          name: 'PRIMARY_view_id',
          type: 'PRIMARY KEY',
          columnNames: ['view_id'],
        },
        fk_page_view_user: {
          name: 'fk_page_view_user',
          type: 'FOREIGN KEY',
          columnNames: ['user_id'],
          targetTableName: 'users',
          targetColumnNames: ['user_id'],
          updateConstraint: 'NO_ACTION',
          deleteConstraint: 'SET_NULL',
        },
      })

      expect(value.tables['products']?.constraints).toEqual({
        PRIMARY_product_id: {
          name: 'PRIMARY_product_id',
          type: 'PRIMARY KEY',
          columnNames: ['product_id'],
        },
        fk_product_creator: {
          name: 'fk_product_creator',
          type: 'FOREIGN KEY',
          columnNames: ['created_by'],
          targetTableName: 'users',
          targetColumnNames: ['user_id'],
          updateConstraint: 'NO_ACTION',
          deleteConstraint: 'SET_NULL',
        },
      })

      // Verify all tables are present
      expect(Object.keys(value.tables)).toContain('users')
      expect(Object.keys(value.tables)).toContain('page_views')
      expect(Object.keys(value.tables)).toContain('products')
    })

    it('should handle multiple schema-qualified foreign key constraints', async () => {
      const { value } = await processor(/* sql */ `
        CREATE SCHEMA ecommerce;
        CREATE SCHEMA analytics;

        CREATE TABLE ecommerce.customers (
          customer_id uuid PRIMARY KEY,
          email varchar(255) NOT NULL
        );

        CREATE TABLE ecommerce.orders (
          order_id uuid PRIMARY KEY,
          customer_id uuid NOT NULL,
          total_amount decimal(10,2) NOT NULL
        );

        CREATE TABLE ecommerce.order_items (
          order_item_id uuid PRIMARY KEY,
          order_id uuid NOT NULL,
          product_id uuid NOT NULL,
          quantity integer NOT NULL
        );

        CREATE TABLE ecommerce.products (
          product_id uuid PRIMARY KEY,
          product_name varchar(255) NOT NULL
        );

        -- Add multiple foreign key constraints
        ALTER TABLE ecommerce.orders
          ADD CONSTRAINT fk_order_customer 
          FOREIGN KEY (customer_id) REFERENCES ecommerce.customers(customer_id);

        ALTER TABLE ecommerce.order_items
          ADD CONSTRAINT fk_order_item_order 
          FOREIGN KEY (order_id) REFERENCES ecommerce.orders(order_id) ON DELETE CASCADE;

        ALTER TABLE ecommerce.order_items
          ADD CONSTRAINT fk_order_item_product 
          FOREIGN KEY (product_id) REFERENCES ecommerce.products(product_id);
      `)

      // Expected: All foreign key constraints should be parsed correctly
      expect(value.tables['orders']?.constraints).toEqual(
        expect.objectContaining({
          fk_order_customer: {
            name: 'fk_order_customer',
            type: 'FOREIGN KEY',
            columnNames: ['customer_id'],
            targetTableName: 'customers',
            targetColumnNames: ['customer_id'],
            updateConstraint: 'NO_ACTION',
            deleteConstraint: 'NO_ACTION',
          },
        }),
      )

      expect(value.tables['order_items']?.constraints).toEqual(
        expect.objectContaining({
          fk_order_item_order: {
            name: 'fk_order_item_order',
            type: 'FOREIGN KEY',
            columnNames: ['order_id'],
            targetTableName: 'orders',
            targetColumnNames: ['order_id'],
            updateConstraint: 'NO_ACTION',
            deleteConstraint: 'CASCADE',
          },
          fk_order_item_product: {
            name: 'fk_order_item_product',
            type: 'FOREIGN KEY',
            columnNames: ['product_id'],
            targetTableName: 'products',
            targetColumnNames: ['product_id'],
            updateConstraint: 'NO_ACTION',
            deleteConstraint: 'NO_ACTION',
          },
        }),
      )
    })

    it('should parse complex dump with multiple foreign key constraints', async () => {
      const { value } = await processor(/* sql */ `
        -- Simulated complex dump with multiple foreign key constraints
        CREATE SCHEMA analytics;
        CREATE SCHEMA auth;
        CREATE SCHEMA ecommerce;

        CREATE TABLE auth.users (user_id uuid PRIMARY KEY);
        CREATE TABLE auth.roles (role_id int PRIMARY KEY);
        CREATE TABLE auth.user_roles (user_id uuid, role_id int, PRIMARY KEY (user_id, role_id));
        
        CREATE TABLE analytics.page_views (view_id bigint PRIMARY KEY, user_id uuid);
        
        CREATE TABLE ecommerce.customers (customer_id uuid PRIMARY KEY, user_id uuid);
        CREATE TABLE ecommerce.products (product_id uuid PRIMARY KEY, created_by uuid);
        CREATE TABLE ecommerce.orders (order_id uuid PRIMARY KEY, customer_id uuid);
        CREATE TABLE ecommerce.order_items (order_item_id uuid PRIMARY KEY, order_id uuid, product_id uuid);

        -- Foreign key constraints
        ALTER TABLE ONLY analytics.page_views ADD CONSTRAINT fk_page_view_user FOREIGN KEY (user_id) REFERENCES auth.users(user_id) ON DELETE SET NULL;
        ALTER TABLE ONLY auth.user_roles ADD CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES auth.users(user_id) ON DELETE CASCADE;
        ALTER TABLE ONLY auth.user_roles ADD CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES auth.roles(role_id) ON DELETE CASCADE;
        ALTER TABLE ONLY ecommerce.customers ADD CONSTRAINT fk_customer_user FOREIGN KEY (user_id) REFERENCES auth.users(user_id) ON DELETE SET NULL;
        ALTER TABLE ONLY ecommerce.products ADD CONSTRAINT fk_product_creator FOREIGN KEY (created_by) REFERENCES auth.users(user_id) ON DELETE SET NULL;
        ALTER TABLE ONLY ecommerce.orders ADD CONSTRAINT fk_order_customer FOREIGN KEY (customer_id) REFERENCES ecommerce.customers(customer_id);
        ALTER TABLE ONLY ecommerce.order_items ADD CONSTRAINT fk_order_item_order FOREIGN KEY (order_id) REFERENCES ecommerce.orders(order_id) ON DELETE CASCADE;
        ALTER TABLE ONLY ecommerce.order_items ADD CONSTRAINT fk_order_item_product FOREIGN KEY (product_id) REFERENCES ecommerce.products(product_id);
      `)

      // Count total foreign key constraints across all tables
      const totalForeignKeys = Object.values(value.tables).reduce(
        (count, table) => {
          const foreignKeys = Object.values(table.constraints || {}).filter(
            (constraint) => constraint.type === 'FOREIGN KEY',
          )
          return count + foreignKeys.length
        },
        0,
      )

      // Should parse all 8 foreign key constraints
      expect(totalForeignKeys).toBe(8)
    })
  })
})
