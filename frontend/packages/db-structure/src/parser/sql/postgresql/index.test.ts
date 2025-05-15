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
              primary: true,
              unique: true,
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
              columnName: 'id',
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
              unique: true,
            }),
          },
          constraints: {
            UNIQUE_mention: {
              name: 'UNIQUE_mention',
              type: 'UNIQUE',
              columnName: 'mention',
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

    // FIXME: `CONSTRAINT` statement is not supported yet
    it.skip('foreign key (one-to-many)', async () => {
      const keyName = 'fk_posts_user_id'
      const { value } = await processor(/* sql */ `
        CREATE TABLE posts (
          id BIGSERIAL PRIMARY KEY,
          user_id INT,
          CONSTRAINT ${keyName} FOREIGN KEY (user_id) REFERENCES users(id)
        );
      `)

      expect(value.relationships).toEqual(
        parserTestCases['foreign key (one-to-many)'](keyName),
      )
    })

    it('foreign key with omit key name', async () => {
      const { value } = await processor(/* sql */ `
        CREATE TABLE posts (
          id BIGSERIAL PRIMARY KEY,
          user_id INT REFERENCES users(id)
        );
      `)

      expect(value.relationships).toEqual(
        parserTestCases['foreign key (one-to-many)'](
          'users_id_to_posts_user_id',
        ),
      )
      expect(value.tables['posts']?.constraints).toEqual({
        PRIMARY_id: {
          name: 'PRIMARY_id',
          type: 'PRIMARY KEY',
          columnName: 'id',
        },
        users_id_to_posts_user_id: {
          name: 'users_id_to_posts_user_id',
          type: 'FOREIGN KEY',
          columnName: 'user_id',
          targetColumnName: 'id',
          targetTableName: 'users',
          updateConstraint: 'NO_ACTION',
          deleteConstraint: 'NO_ACTION',
        },
      })
    })

    it('foreign key (one-to-one)', async () => {
      const keyName = 'users_id_to_posts_user_id'
      const { value } = await processor(/* sql */ `
        CREATE TABLE posts (
          id BIGSERIAL PRIMARY KEY,
          user_id INT REFERENCES users(id) UNIQUE
        );
      `)

      expect(value.relationships).toEqual(
        parserTestCases['foreign key (one-to-one)'](keyName),
      )
      expect(value.tables['posts']?.constraints).toEqual({
        PRIMARY_id: {
          name: 'PRIMARY_id',
          type: 'PRIMARY KEY',
          columnName: 'id',
        },
        UNIQUE_user_id: {
          name: 'UNIQUE_user_id',
          type: 'UNIQUE',
          columnName: 'user_id',
        },
        users_id_to_posts_user_id: {
          name: 'users_id_to_posts_user_id',
          type: 'FOREIGN KEY',
          columnName: 'user_id',
          targetColumnName: 'id',
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
          columnName: 'id',
        },
        CHECK_price: {
          name: 'CHECK_price',
          type: 'CHECK',
          detail: 'CHECK (price > 0)',
        },
      })
    })
  })

  describe('should parse ALTER TABLE statement correctly', () => {
    it('foreign key (one-to-many)', async () => {
      const keyName = 'fk_posts_user_id'
      const { value } = await processor(/* sql */ `
        CREATE TABLE posts (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL
        );

        ALTER TABLE posts
        ADD CONSTRAINT ${keyName} FOREIGN KEY (user_id) REFERENCES users(id);
      `)

      expect(value.relationships).toEqual(
        parserTestCases['foreign key (one-to-many)'](keyName),
      )
      expect(value.tables['posts']?.constraints).toEqual({
        PRIMARY_id: {
          name: 'PRIMARY_id',
          type: 'PRIMARY KEY',
          columnName: 'id',
        },
        fk_posts_user_id: {
          name: 'fk_posts_user_id',
          type: 'FOREIGN KEY',
          columnName: 'user_id',
          targetTableName: 'users',
          targetColumnName: 'id',
          updateConstraint: 'NO_ACTION',
          deleteConstraint: 'NO_ACTION',
        },
      })
    })

    it('foreign key (one-to-one)', async () => {
      const keyName = 'users_id_to_posts_user_id'
      const { value } = await processor(/* sql */ `
        CREATE TABLE posts (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL UNIQUE
        );

        ALTER TABLE posts
        ADD CONSTRAINT users_id_to_posts_user_id FOREIGN KEY (user_id) REFERENCES users(id);
      `)

      expect(value.relationships).toEqual(
        parserTestCases['foreign key (one-to-one)'](keyName),
      )
      expect(value.tables['posts']?.constraints).toEqual({
        PRIMARY_id: {
          name: 'PRIMARY_id',
          type: 'PRIMARY KEY',
          columnName: 'id',
        },
        UNIQUE_user_id: {
          name: 'UNIQUE_user_id',
          type: 'UNIQUE',
          columnName: 'user_id',
        },
        users_id_to_posts_user_id: {
          name: 'users_id_to_posts_user_id',
          type: 'FOREIGN KEY',
          columnName: 'user_id',
          targetTableName: 'users',
          targetColumnName: 'id',
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

      expect(value.relationships).toEqual(
        parserTestCases['foreign key with action'],
      )
      expect(value.tables['posts']?.constraints).toEqual({
        PRIMARY_id: {
          name: 'PRIMARY_id',
          type: 'PRIMARY KEY',
          columnName: 'id',
        },
        fk_posts_user_id: {
          name: 'fk_posts_user_id',
          type: 'FOREIGN KEY',
          columnName: 'user_id',
          targetTableName: 'users',
          targetColumnName: 'id',
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
          columnName: 'id',
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

      const value = { tables: {}, relationships: {}, tableGroups: {} }
      const errors = [
        new UnexpectedTokenWarningError('syntax error at or near "CREATEe"'),
      ]

      expect(result).toEqual({ value, errors })
    })
  })

  describe('Long "create table" statement (exceeds 500 lines, surpassing CHUNK_SIZE)', () => {
    it('parses without errors', async () => {
      const _500Lines = '\n'.repeat(500)
      const { value, errors } = await processor(/* sql */ `
        CREATE TABLE users (
          id BIGSERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL
          ${_500Lines}
        );
      `)

      expect(value).toEqual(parserTestCases.normal)
      expect(errors).toEqual([])
    })
  }, 30000)

  describe('Long "create function" statement (exceeds 500 lines, surpassing CHUNK_SIZE)', () => {
    it('parses without errors', async () => {
      const _500Lines = '\n'.repeat(500)
      const { value, errors } = await processor(/* sql */ `
        CREATE TABLE users (
          id BIGSERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL
        );

        CREATE OR REPLACE FUNCTION test_proc(p_id integer)
        RETURNS void AS $$
        BEGIN
            RAISE NOTICE 'Stored procedure called with parameter: %', p_id;
            ${_500Lines}
        END;
        $$ LANGUAGE plpgsql;
      `)
      expect(value).toEqual(parserTestCases.normal)
      expect(errors).toEqual([])
    })
  }, 30000)
})
