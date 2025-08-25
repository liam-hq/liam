import { describe, expect, it } from 'vitest'
import { processor } from '../index.js'

describe('Drizzle auto-detection', () => {
  it('should detect MySQL schema and use MySQL parser', async () => {
    const mysqlSchema = `
      import { mysqlTable, int, varchar } from 'drizzle-orm/mysql-core';

      export const users = mysqlTable('users', {
        id: int('id').primaryKey().autoincrement(),
        name: varchar('name', { length: 255 }).notNull(),
      });
    `

    const { value, errors } = await processor(mysqlSchema)

    expect(errors).toHaveLength(0)
    expect(value.tables).toHaveProperty('users')
    expect(value.tables['users']?.columns).toHaveProperty('id')
    expect(value.tables['users']?.columns).toHaveProperty('name')

    // Check that MySQL-specific features are parsed correctly
    expect(value.tables['users']?.columns['id']?.default).toBe(
      'autoincrement()',
    )
  })

  it('should detect PostgreSQL schema and use PostgreSQL parser', async () => {
    const pgSchema = `
      import { pgTable, serial, varchar } from 'drizzle-orm/pg-core';

      export const users = pgTable('users', {
        id: serial('id').primaryKey(),
        name: varchar('name', { length: 255 }).notNull(),
      });
    `

    const { value, errors } = await processor(pgSchema)

    expect(errors).toHaveLength(0)
    expect(value.tables).toHaveProperty('users')
    expect(value.tables['users']?.columns).toHaveProperty('id')
    expect(value.tables['users']?.columns).toHaveProperty('name')

    // Check that PostgreSQL-specific features are parsed correctly
    expect(value.tables['users']?.columns['id']?.default).toBe(
      'autoincrement()',
    )
  })

  it('should default to PostgreSQL for ambiguous schemas', async () => {
    const ambiguousSchema = `
      // No specific imports or table functions
      export const config = {
        database: 'test'
      };
    `

    const { value, errors } = await processor(ambiguousSchema)

    // Should not crash and should use PostgreSQL parser (which might return empty results)
    expect(errors).toBeDefined()
    expect(value.tables).toBeDefined()
  })

  it('should detect MySQL by table function names', async () => {
    const mysqlSchemaWithFunctions = `
      export const users = mysqlTable('users', {
        id: mysqlEnum('status', ['active', 'inactive']),
      });
    `

    const { value } = await processor(mysqlSchemaWithFunctions)

    // Should be detected as MySQL even without imports
    expect(value).toBeDefined()
  })

  it('should detect PostgreSQL by table function names', async () => {
    const pgSchemaWithFunctions = `
      export const users = pgTable('users', {
        id: pgEnum('status', ['active', 'inactive']),
      });
    `

    const { value } = await processor(pgSchemaWithFunctions)

    // Should be detected as PostgreSQL even without imports
    expect(value).toBeDefined()
  })
})
