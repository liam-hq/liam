import { describe, expect, it } from 'vitest'
import type { Table } from '../../../schema/index.js'
import { aColumn, aDBStructure, aTable } from '../../../schema/index.js'
import { processor } from './index.js'

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
              name: aColumn({
                name: 'name',
                type: 'varchar',
                notNull: false,
              }),
              ...override?.columns,
            },
            indices: {
              ...override?.indices,
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

      const expected = userTable()

      expect(result).toEqual(expected)
    })

    it('unique', async () => {
      const result = await processor(/* PostgreSQL */ `
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE
        );
      `)

      const expected = userTable({
        columns: {
          name: aColumn({
            name: 'name',
            type: 'varchar',
            unique: true,
          }),
        },
      })

      expect(result).toEqual(expected)
    })

    it('default value as varchar', async () => {
      const result = await processor(/* PostgreSQL */ `
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) DEFAULT 'new user'
        );
      `)

      const expected = userTable({
        columns: {
          name: aColumn({
            name: 'name',
            type: 'varchar',
            default: 'new user',
          }),
        },
      })

      expect(result).toEqual(expected)
    })

    it('default value as integer', async () => {
      const result = await processor(/* PostgreSQL */ `
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255),
          age INTEGER DEFAULT 30
        );
      `)

      const expected = userTable({
        columns: {
          age: aColumn({
            name: 'age',
            type: 'int4',
            default: 30,
          }),
        },
      })

      expect(result).toEqual(expected)
    })

    it('default value as boolean', async () => {
      const result = await processor(/* PostgreSQL */ `
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255),
          active BOOLEAN DEFAULT TRUE
        );
      `)

      const expected = userTable({
        columns: {
          active: aColumn({
            name: 'active',
            type: 'bool',
            default: true,
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

    it('index', async () => {
      const result = await processor(/* PostgreSQL */ `
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255)
        );

        CREATE INDEX index_users_on_id_and_name ON public.users USING btree (id, name);
      `)

      const expected = userTable({
        indices: {
          index_users_on_id_and_name: {
            name: 'index_users_on_id_and_name',
            unique: false,
            columns: ['id', 'name'],
          },
        },
      })

      expect(result).toEqual(expected)
    })

    it('unique index', async () => {
      const result = await processor(/* PostgreSQL */ `
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255)
        );

        CREATE UNIQUE INDEX index_users_on_id_and_name ON public.users USING btree (id, name);
      `)

      const expected = userTable({
        indices: {
          index_users_on_id_and_name: {
            name: 'index_users_on_id_and_name',
            unique: true,
            columns: ['id', 'name'],
          },
        },
      })

      expect(result).toEqual(expected)
    })
  })
})
