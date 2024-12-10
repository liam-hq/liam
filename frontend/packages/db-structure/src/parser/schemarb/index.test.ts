import { describe, expect, it } from 'vitest'
import type { Table } from '../../schema/index.js'
import {
  aColumn,
  aDBStructure,
  aRelationship,
  aTable,
} from '../../schema/index.js'
import { UnsupportedTokenError, processor } from './index.js'

import { parserTestCases } from '../__tests__/index.js'

describe(processor, () => {
  const userTable = (override?: Partial<Table>) =>
    aDBStructure({
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
          indices: {
            ...override?.indices,
          },
          comment: override?.comment ?? null,
        }),
      },
    })

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
            // TODO: `t.integer` should be converted to int4 for PostgreSQL
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
            // TODO: `t.boolean` should be converted to bool for PostgreSQL
            type: 'boolean',
            notNull: false,
            default: true,
          }),
        },
      })

      expect(value).toEqual(expected)
    })

    it('unique', async () => {
      const { value } = await processor(/* Ruby */ `
        create_table "users" do |t|
          t.text "mention", unique: true
        end
      `)

      expect(value).toEqual(parserTestCases.unique)
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
            primary: true,
            unique: true,
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

      const expected = aDBStructure({
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
      const { value } = await processor(/* Ruby */ `
        create_table "users" do |t|
          t.string "email"
          t.index [ "id", "email" ], name: "index_users_on_id_and_email"
        end
      `)

      expect(value).toEqual(parserTestCases['index (unique: false)'])
    })

    it('index (unique: true)', async () => {
      const { value } = await processor(/* Ruby */ `
        create_table "users" do |t|
          t.string "email"
          t.index ["email"], name: "index_users_on_email", unique: true
        end
      `)

      expect(value).toEqual(parserTestCases['index (unique: true)'])
    })

    it('foreign key', async () => {
      const { value } = await processor(/* Ruby */ `
        add_foreign_key "posts", "users", column: "user_id", name: "fk_posts_user_id", on_update: :restrict, on_delete: :cascade
      `)

      const rel = aRelationship({
        name: 'fk_posts_user_id',
        primaryTableName: 'users',
        primaryColumnName: 'id',
        foreignTableName: 'posts',
        foreignColumnName: 'user_id',
        cardinality: 'ONE_TO_MANY',
        updateConstraint: 'RESTRICT',
        deleteConstraint: 'CASCADE',
      })

      const expected = { fk_posts_user_id: rel }

      expect(value.relationships).toEqual(expected)
    })

    it('foreign key(omit column name)', async () => {
      const result = await processor(/* Ruby */ `
        add_foreign_key "posts", "users", name: "fk_posts_user_id", on_update: :restrict, on_delete: :cascade
      `)

      const rel = aRelationship({
        name: 'fk_posts_user_id',
        primaryTableName: 'users',
        primaryColumnName: 'id',
        foreignTableName: 'posts',
        foreignColumnName: 'user_id',
        cardinality: 'ONE_TO_MANY',
        updateConstraint: 'RESTRICT',
        deleteConstraint: 'CASCADE',
      })

      const expected = { fk_posts_user_id: rel }

      expect(result.relationships).toEqual(expected)
    })

    it('unique foreign key', async () => {
      const { value } = await processor(/* Ruby */ `
        create_table "posts" do |t|
          t.bigint "user_id", unique: true
        end

        add_foreign_key "posts", "users", column: "user_id", name: "fk_posts_user_id"
      `)

      const rel = aRelationship({
        name: 'fk_posts_user_id',
        primaryTableName: 'users',
        primaryColumnName: 'id',
        foreignTableName: 'posts',
        foreignColumnName: 'user_id',
        cardinality: 'ONE_TO_ONE',
      })

      const expected = { fk_posts_user_id: rel }

      expect(value.relationships).toEqual(expected)
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
