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
                type: 'serial',
                notNull: true,
                primary: true,
                increment: true,
              }),
              ...override?.columns,
            },
          }),
        },
      })

    it('not null', async () => {
      const result = await processor(/* PostgreSQL */ `
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL
        );
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

      expect(result).toEqual(expected)
    })

    it('nullable', async () => {
      const result = await processor(/* PostgreSQL */ `
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255)
        );
      `)

      const expected = userTable({
        columns: {
          name: aColumn({
            name: 'name',
            type: 'varchar',
            notNull: false,
          }),
        },
      })

      expect(result).toEqual(expected)
    })

    it('should parse foreign keys to relationships', async () => {
      const result = await processor(/* PostgreSQL */ `
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255)
        );

        CREATE TABLE posts (
          id SERIAL PRIMARY KEY,
          user_id INT REFERENCES users(id)
        );
      `)

      const expectedRelationships = {
        users_id_to_posts_user_id: {
          name: 'users_id_to_posts_user_id',
          primaryTableName: 'users',
          primaryColumnName: 'id',
          foreignTableName: 'posts',
          foreignColumnName: 'user_id',
          cardinality: 'ONE_TO_MANY',
          updateConstraint: 'NO ACTION',
          deleteConstraint: 'NO ACTION',
        },
      }

      expect(result.relationships).toEqual(expectedRelationships)
    })

    // TODO: Implement default value
  })
})
