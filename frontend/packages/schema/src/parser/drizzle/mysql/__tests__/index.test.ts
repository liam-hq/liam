import { describe, expect, it } from 'vitest'
import { processor } from '../index.js'

describe(processor, () => {
  // MySQL-specific tests (tests that are unique to MySQL and not covered by unified tests)
  describe('MySQL-specific functionality', () => {
    it('MySQL-specific types and methods (tinyint, mediumint, datetime, year, json, mysqlEnum)', async () => {
      const { value } = await processor(`
        import {
          mysqlTable,
          mysqlEnum,
          int,
          tinyint,
          mediumint,
          bigint,
          float,
          double,
          decimal,
          datetime,
          year,
          json,
          mediumtext,
          longtext,
          boolean,
        } from 'drizzle-orm/mysql-core';

        export const statusEnum = mysqlEnum('status', ['active', 'inactive', 'pending']);

        export const users = mysqlTable('users', {
          id: int('id').primaryKey().autoincrement(),
          age: tinyint('age'), // MySQL-specific small integer
          score: mediumint('score'), // MySQL-specific medium integer
          balance: bigint('balance', { mode: 'number' }),
          rating: float('rating'),
          precision_value: double('precision_value'),
          price: decimal('price', { precision: 10, scale: 2 }),
          created_at: datetime('created_at').defaultNow(),
          birth_year: year('birth_year'), // MySQL-specific year type
          metadata: json('metadata'), // MySQL JSON (different from PostgreSQL jsonb)
          bio: mediumtext('bio'), // MySQL-specific text size
          notes: longtext('notes'), // MySQL-specific text size
          is_active: boolean('is_active').default(true),
          status: mysqlEnum('status', ['active', 'inactive', 'pending']).default('active'),
        });
      `)

      // Test MySQL-specific integer types
      expect(value.tables['users']?.columns['age']?.type).toBe('tinyint')
      expect(value.tables['users']?.columns['score']?.type).toBe('mediumint')
      expect(value.tables['users']?.columns['balance']?.type).toBe('bigint')

      // Test MySQL-specific floating point types
      expect(value.tables['users']?.columns['rating']?.type).toBe('float')
      expect(value.tables['users']?.columns['precision_value']?.type).toBe(
        'double',
      )
      expect(value.tables['users']?.columns['price']?.type).toBe(
        'decimal(10,2)',
      )

      // Test MySQL-specific date/time types
      expect(value.tables['users']?.columns['created_at']?.type).toBe(
        'datetime',
      )
      expect(value.tables['users']?.columns['created_at']?.default).toBe(
        'now()',
      )
      expect(value.tables['users']?.columns['birth_year']?.type).toBe('year')

      // Test MySQL-specific text types
      expect(value.tables['users']?.columns['bio']?.type).toBe('mediumtext')
      expect(value.tables['users']?.columns['notes']?.type).toBe('longtext')

      // Test MySQL JSON type (different from PostgreSQL jsonb)
      expect(value.tables['users']?.columns['metadata']?.type).toBe('json')

      // Test mysqlEnum usage (inline enum definition)
      expect(value.tables['users']?.columns['status']?.type).toBe('enum')
      expect(value.tables['users']?.columns['status']?.default).toBe('active')

      // Test autoincrement (MySQL-specific implementation)
      expect(value.tables['users']?.columns['id']?.default).toBe(
        'autoincrement()',
      )
    })
  })
})
