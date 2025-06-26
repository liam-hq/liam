import { describe, expect, it } from 'vitest'
import type { Table } from '../../schema/index.js'
import {
  aCheckConstraint,
  aColumn,
  aForeignKeyConstraint,
  anIndex,
  aPrimaryKeyConstraint,
  aSchema,
  aTable,
  aUniqueConstraint,
} from '../../schema/index.js'
import { createParserTestCases } from '../__tests__/index.js'
import { processor, UnsupportedTokenError } from './index.js'

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
            PRIMARY_id: {
              type: 'PRIMARY KEY',
              name: 'PRIMARY_id',
              columnName: 'id',
            },
            ...override?.constraints,
          },
        }),
      },
    })
  const parserTestCases = createParserTestCases(userTable)

  describe('should parse create_table correctly', () => {
    it('table comment', async () => {
      const { value } = await processor(/* Ruby */ `
        create_table "users", comment: "store our users." do |t|
        end
      `)

      expect(value).toEqual(parserTestCases['table comment'])
    })

    it('column comment', async () => {
      const { value } = await processor(/* Ruby */ `
        create_table "users" do |t|
          t.text "description", comment: 'this is description'
        end
      `)

      expect(value).toEqual(parserTestCases['column comment'])
    })

    it('not null', async () => {
      const { value } = await processor(/* Ruby */ `
        create_table "users" do |t|
          t.string "name", null: false
        end
      `)

      const expected = userTable({
        columns: {
          name: aColumn({
            name: 'name',
            type: 'varchar',
            notNull: true,
          }),
        },
      })

      expect(value).toEqual(expected)
    })

    it('nullable', async () => {
      const { value } = await processor(/* Ruby */ `
        create_table "users" do |t|
          t.text "description", null: true
        end
      `)

      expect(value).toEqual(parserTestCases.nullable)
    })

    it('default value as string', async () => {
      const { value } = await processor(/* Ruby */ `
        create_table "users" do |t|
          t.text "description", default: "user's description", null: true
        end
      `)

      expect(value).toEqual(parserTestCases['default value as string'])
    })

    it('default value as integer', async () => {
      const { value } = await processor(/* Ruby */ `
        create_table "users" do |t|
          t.integer "age", default: 30, null: true
        end
      `)

      const expected = userTable({
        columns: {
          age: aColumn({
            name: 'age',
            type: 'integer',
            notNull: false,
            default: 30,
          }),
        },
      })

      expect(value).toEqual(expected)
    })

    it('default value as boolean', async () => {
      const { value } = await processor(/* Ruby */ `
        create_table "users" do |t|
          t.boolean "active", default: true, null: true
        end
      `)

      const expected = userTable({
        columns: {
          active: aColumn({
            name: 'active',
            type: 'boolean',
            notNull: false,
            default: true,
          }),
        },
      })

      expect(value).toEqual(expected)
    })

    it('primary key as args', async () => {
      const { value } = await processor(/* Ruby */ `
        create_table "users", id: :bigint
      `)

      const expected = userTable({
        columns: {
          id: aColumn({
            name: 'id',
            type: 'bigint',
            notNull: true,
          }),
        },
      })

      expect(value).toEqual(expected)
    })

    it('no primary key', async () => {
      const { value } = await processor(/* Ruby */ `
        create_table "users", id: false do |t|
          t.string "name"
        end
      `)

      const expected = aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              name: aColumn({
                name: 'name',
                type: 'varchar',
              }),
            },
          }),
        },
      })

      expect(value).toEqual(expected)
    })

    it('index (unique: false)', async () => {
      const indexName = 'index_users_on_id_and_email'
      const { value } = await processor(/* Ruby */ `
        create_table "users" do |t|
          t.string "email"
          t.index [ "id", "email" ], name: "index_users_on_id_and_email"
        end
      `)

      expect(value).toEqual(
        parserTestCases['index (unique: false)'](indexName, ''),
      )
    })

    it('index (unique: true)', async () => {
      const { value } = await processor(/* Ruby */ `
        create_table "users" do |t|
          t.string "email"
          t.index ["email"], name: "index_users_on_email", unique: true
        end
      `)

      const expected = aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({
                name: 'id',
                type: 'bigserial',
                notNull: true,
              }),
              email: aColumn({
                name: 'email',
                type: 'varchar',
              }),
            },
            indexes: {
              index_users_on_email: anIndex({
                name: 'index_users_on_email',
                columns: ['email'],
                unique: true,
              }),
            },
            constraints: {
              PRIMARY_id: aPrimaryKeyConstraint({
                name: 'PRIMARY_id',
                columnName: 'id',
              }),
              UNIQUE_email: aUniqueConstraint({
                name: 'UNIQUE_email',
                columnName: 'email',
              }),
            },
          }),
        },
      })

      expect(value).toEqual(expected)
    })

    it('foreign key', async () => {
      const keyName = 'fk_posts_user_id'
      const { value } = await processor(/* Ruby */ `
        create_table "posts" do |t|
          t.bigint "user_id"
        end

        add_foreign_key "posts", "users", column: "user_id", name: "${keyName}"
      `)

      expect(value.tables['posts']?.constraints).toEqual({
        PRIMARY_id: aPrimaryKeyConstraint({
          name: 'PRIMARY_id',
          columnName: 'id',
        }),
        fk_posts_user_id: aForeignKeyConstraint({
          name: 'fk_posts_user_id',
          columnName: 'user_id',
          targetTableName: 'users',
          targetColumnName: 'id',
        }),
      })
    })

    it('foreign key (without explicit constraint name and column options)', async () => {
      const { value } = await processor(/* Ruby */ `
        create_table "posts" do |t|
          t.bigint "user_id"
        end

        add_foreign_key "posts", "users"
      `)

      expect(value.tables['posts']?.constraints).toEqual({
        PRIMARY_id: aPrimaryKeyConstraint({
          name: 'PRIMARY_id',
          columnName: 'id',
        }),
        fk_posts_user_id: aForeignKeyConstraint({
          name: 'fk_posts_user_id',
          columnName: 'user_id',
          targetTableName: 'users',
          targetColumnName: 'id',
        }),
      })
    })

    it('foreign keys with action', async () => {
      const { value } = await processor(/* Ruby */ `
        create_table "posts" do |t|
          t.bigint "user_id"
        end

        add_foreign_key "posts", "users", column: "user_id", name: "fk_posts_user_id", on_update: :restrict, on_delete: :cascade
      `)

      expect(value.tables['posts']?.constraints).toEqual({
        PRIMARY_id: aPrimaryKeyConstraint({
          type: 'PRIMARY KEY',
          name: 'PRIMARY_id',
          columnName: 'id',
        }),
        fk_posts_user_id: aForeignKeyConstraint({
          type: 'FOREIGN KEY',
          name: 'fk_posts_user_id',
          columnName: 'user_id',
          targetTableName: 'users',
          targetColumnName: 'id',
          updateConstraint: 'RESTRICT',
          deleteConstraint: 'CASCADE',
        }),
      })
    })

    it('check constraint', async () => {
      const { value } = await processor(/* Ruby */ `
        create_table "users" do |t|
          t.integer "age"
        end

        add_check_constraint "users", "age >= 20 and age < 20", name: "age_range_check"
      `)

      expect(value.tables['users']?.constraints).toEqual({
        PRIMARY_id: aPrimaryKeyConstraint({
          name: 'PRIMARY_id',
          columnName: 'id',
        }),
        age_range_check: aCheckConstraint({
          name: 'age_range_check',
          detail: 'age >= 20 and age < 20',
        }),
      })
    })

    it('check constraint in create_table', async () => {
      const { value } = await processor(/* Ruby */ `
        create_table "users" do |t|
          t.integer "age"
          t.check_constraint "age between 20 and 100", name: "age_check"
        end
      `)

      expect(value.tables['users']?.constraints).toEqual({
        PRIMARY_id: aPrimaryKeyConstraint({
          name: 'PRIMARY_id',
          columnName: 'id',
        }),
        age_check: aCheckConstraint({
          name: 'age_check',
          detail: 'age between 20 and 100',
        }),
      })
    })

    it('inline index (index: true)', async () => {
      const { value } = await processor(/* Ruby */ `
        create_table "users" do |t|
          t.string "username", index: true
        end
      `)

      expect(value.tables['users']?.indexes).toEqual({
        index_username: anIndex({
          name: 'index_username',
          columns: ['username'],
          unique: false,
        }),
      })
    })

    it('inline index (index: { unique: true })', async () => {
      const { value } = await processor(/* Ruby */ `
        create_table "users" do |t|
          t.text "mention", index: { unique: true }
        end
      `)

      expect(value.tables['users']?.indexes).toEqual({
        unique_mention: anIndex({
          name: 'unique_mention',
          columns: ['mention'],
          unique: true,
        }),
      })
      expect(value.tables['users']?.constraints).toEqual({
        PRIMARY_id: aPrimaryKeyConstraint({
          name: 'PRIMARY_id',
          columnName: 'id',
        }),
        UNIQUE_mention: aUniqueConstraint({
          name: 'UNIQUE_mention',
          columnName: 'mention',
        }),
      })
    })

    it('inline index with custom name', async () => {
      const { value } = await processor(/* Ruby */ `
        create_table "users" do |t|
          t.string "slug", index: { unique: true, name: "index_users_on_slug" }
        end
      `)

      expect(value.tables['users']?.indexes).toEqual({
        index_users_on_slug: anIndex({
          name: 'index_users_on_slug',
          columns: ['slug'],
          unique: true,
        }),
      })
      expect(value.tables['users']?.constraints).toEqual({
        PRIMARY_id: aPrimaryKeyConstraint({
          name: 'PRIMARY_id',
          columnName: 'id',
        }),
        UNIQUE_slug: aUniqueConstraint({
          name: 'UNIQUE_slug',
          columnName: 'slug',
        }),
      })
    })

    it('inline index with using option', async () => {
      const { value } = await processor(/* Ruby */ `
        create_table "users" do |t|
          t.string "email", index: { using: "gin" }
        end
      `)

      expect(value.tables['users']?.indexes).toEqual({
        index_email: anIndex({
          name: 'index_email',
          columns: ['email'],
          unique: false,
          type: 'gin',
        }),
      })
    })

    it('multiple inline indexes', async () => {
      const { value } = await processor(/* Ruby */ `
        create_table "users" do |t|
          t.string "username", index: true
          t.string "email", index: { unique: true }
          t.text "bio", index: { name: "custom_bio_index" }
        end
      `)

      expect(value.tables['users']?.indexes).toEqual({
        index_username: anIndex({
          name: 'index_username',
          columns: ['username'],
          unique: false,
        }),
        unique_email: anIndex({
          name: 'unique_email',
          columns: ['email'],
          unique: true,
        }),
        custom_bio_index: anIndex({
          name: 'custom_bio_index',
          columns: ['bio'],
          unique: false,
        }),
      })
    })
  })

  describe('abnormal cases', () => {
    it('Cannot handle if the table name is a variable', async () => {
      const result = await processor(/* Ruby */ `
        create_table "users" do |t|
        end

        variable = "posts"
        create_table variable do |t|
        end
      `)

      const value = userTable()
      const errors = [
        new UnsupportedTokenError(
          'Expected a string for the table name, but received different data',
        ),
      ]

      expect(result).toEqual({ value, errors })
    })
  })
})
