import type { Table } from 'src/schema'
import { aColumn, aDBStructure, aTable } from 'src/schema/factories'
import { describe, expect, it } from 'vitest'
import { processor } from '.'

describe(processor, () => {
  describe('should parse create_table correctry', () => {
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
              }),
              ...override?.columns,
            },
          }),
        },
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
          t.string "name", null: true
        end
      `)

      const expected = userTable({
        columns: {
          name: aColumn({
            name: 'name',
            type: 'string',
            notNull: false,
          }),
        },
      })

      expect(result).toEqual(expected)
    })

    it('defalt value as string', async () => {
      const result = await processor(/* Ruby */ `
        create_table "users" do |t|
          t.string "name", default: "new user", null: true
        end
      `)

      const expected = userTable({
        columns: {
          name: aColumn({
            name: 'name',
            type: 'string',
            notNull: false,
            default: 'new user',
          }),
        },
      })

      expect(result).toEqual(expected)
    })

    it('defalt value as integer', async () => {
      const result = await processor(/* Ruby */ `
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

      expect(result).toEqual(expected)
    })

    it('defalt value as boolean', async () => {
      const result = await processor(/* Ruby */ `
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

      expect(result).toEqual(expected)
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
          }),
        },
      })

      expect(result).toEqual(expected)
    })

    it('unique', async () => {
      const result = await processor(/* Ruby */ `
        create_table "users" do |t|
          t.string "name", unique: true
        end
      `)

      const expected = userTable({
        columns: {
          name: aColumn({
            name: 'name',
            type: 'string',
            unique: true,
          }),
        },
      })

      expect(result).toEqual(expected)
    })
  })
})
