import { describe, expect, it } from 'vitest'
import type { Table } from '../../schema/index.js'
import {
  aColumn,
  aDBStructure,
  aRelationship,
  aTable,
  anIndex,
} from '../../schema/index.js'
import { processor } from './index.js'

import { parserTestCases } from '../__tests__/index.js'

describe(processor, () => {
  describe('should parse create_table correctly', () => {
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

    it('table comment', async () => {
      const result = await processor(/* Ruby */ `
        create_table "users", comment: "store our users." do |t|
        end
      `)

      expect(result).toEqual(parserTestCases['table comment'])
    })

    it('not null', async () => {
      const result = await processor(/* Ruby */ `
        create_table "users" do |t|
          t.string "name", null: false
        end
      `)

      const expected = userTable({
        columns: {
          name: aColumn({
            name: 'name',
            // TODO: `t.string` should be converted to varchar for PostgreSQL
            type: 'string',
            notNull: true,
          }),
        },
      })

      expect(result).toEqual(expected)
    })

    it('nullable', async () => {
      const result = await processor(/* Ruby */ `
        create_table "users" do |t|
          t.text "description", null: true
        end
      `)

      expect(result).toEqual(parserTestCases.nullable)
    })

    it('default value as string', async () => {
      const result = await processor(/* Ruby */ `
        create_table "users" do |t|
          t.text "description", default: "user's description", null: true
        end
      `)

      expect(result).toEqual(parserTestCases['default value as string'])
    })

    it('default value as integer', async () => {
      const result = await processor(/* Ruby */ `
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

      expect(result).toEqual(expected)
    })

    it('default value as boolean', async () => {
      const result = await processor(/* Ruby */ `
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

      expect(result).toEqual(expected)
    })

    it('unique', async () => {
      const result = await processor(/* Ruby */ `
        create_table "users" do |t|
          t.text "mention", unique: true
        end
      `)

      expect(result).toEqual(parserTestCases.unique)
    })

    it('primary key as args', async () => {
      const result = await processor(/* Ruby */ `
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

      expect(result).toEqual(expected)
    })

    it('index', async () => {
      const result = await processor(/* Ruby */ `
        create_table "users" do |t|
          t.index [ "id", "email" ], name: "index_users_on_id_and_email", unique: true
        end
      `)

      const expected = userTable({
        indices: {
          index_users_on_id_and_email: anIndex({
            name: 'index_users_on_id_and_email',
            unique: true,
            columns: ['id', 'email'],
          }),
        },
      })

      expect(result).toEqual(expected)
    })

    it('column comment', async () => {
      const result = await processor(/* Ruby */ `
        create_table "users" do |t|
          t.string "name", comment: 'this is name'
        end
      `)

      const expected = userTable({
        columns: {
          name: aColumn({
            name: 'name',
            type: 'string',
            comment: 'this is name',
          }),
        },
      })

      expect(result).toEqual(expected)
    })

    it('foreign key', async () => {
      const result = await processor(/* Ruby */ `
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

      expect(result.relationships).toEqual(expected)
    })

    it('unique foreign key', async () => {
      const result = await processor(/* Ruby */ `
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

      expect(result.relationships).toEqual(expected)
    })
  })
})
