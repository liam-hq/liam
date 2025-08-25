import { describe, expect, it } from 'vitest'
import { processor } from '../index.js'

describe(processor, () => {
  // PostgreSQL-specific tests (tests that are unique to PostgreSQL and not covered by unified tests)
  describe('PostgreSQL-specific functionality', () => {
    it('PostgreSQL-specific types and methods (uuid, jsonb, defaultRandom, pgEnum)', async () => {
      const { value } = await processor(`
        import {
          pgTable,
          pgEnum,
          serial,
          text,
          timestamp,
          boolean,
          integer,
          numeric,
          jsonb,
          uuid,
          primaryKey,
        } from 'drizzle-orm/pg-core';
        import { relations } from 'drizzle-orm';

        export const userRoleEnum = pgEnum('user_role', ['student', 'instructor', 'admin']);

        export const users = pgTable('users', {
          id: serial('id').primaryKey(),
          uuid: uuid('uuid').defaultRandom().notNull(),
          name: text('name').notNull(),
          role: userRoleEnum('role').default('student').notNull(),
          metadata: jsonb('metadata'),
          score: numeric('score', { precision: 10, scale: 2 }),
        });
      `)

      // Test PostgreSQL-specific types and methods
      expect(value.tables['users']).toBeDefined()

      // Test serial type (PostgreSQL-specific auto-increment)
      expect(value.tables['users']?.columns['id']?.type).toBe('serial')

      // Test uuid with defaultRandom (PostgreSQL-specific)
      expect(value.tables['users']?.columns['uuid']?.type).toBe('uuid')
      expect(value.tables['users']?.columns['uuid']?.default).toBe(
        'gen_random_uuid()',
      )

      // Test pgEnum usage
      expect(value.tables['users']?.columns['role']?.type).toBe('user_role')
      expect(value.tables['users']?.columns['role']?.default).toBe('student')

      // Test jsonb type (PostgreSQL-specific)
      expect(value.tables['users']?.columns['metadata']?.type).toBe('jsonb')

      // Test numeric type (PostgreSQL-specific precision)
      expect(value.tables['users']?.columns['score']?.type).toBe(
        'numeric(10,2)',
      )
    })
  })
})
