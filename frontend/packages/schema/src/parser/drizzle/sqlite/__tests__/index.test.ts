import { describe, expect, it } from 'vitest'
import { processor } from '../index.js'

describe(processor, () => {
  // SQLite-specific tests (tests that are unique to SQLite and not covered by unified tests)
  describe('SQLite-specific functionality', () => {
    it('SQLite column types (integer, text, real, blob, numeric)', async () => {
      const { value } = await processor(`
        import { sqliteTable, integer, text, real, blob, numeric } from 'drizzle-orm/sqlite-core';

        export const items = sqliteTable('items', {
          id: integer('id').primaryKey({ autoIncrement: true }),
          title: text('title').notNull(),
          price: real('price'),
          payload: blob('payload'),
          amount: numeric('amount'),
        });
      `)

      expect(value.tables['items']).toBeDefined()
      expect(value.tables['items']?.columns['id']?.type).toBe('integer')
      expect(value.tables['items']?.columns['title']?.type).toBe('text')
      expect(value.tables['items']?.columns['price']?.type).toBe('real')
      expect(value.tables['items']?.columns['payload']?.type).toBe('blob')
      expect(value.tables['items']?.columns['amount']?.type).toBe('numeric')
    })

    it('integer primary key with autoIncrement', async () => {
      const { value } = await processor(`
        import { sqliteTable, integer } from 'drizzle-orm/sqlite-core';

        export const users = sqliteTable('users', {
          id: integer('id').primaryKey({ autoIncrement: true }),
        });
      `)

      expect(value.tables['users']?.columns['id']?.default).toBe(
        'autoincrement()',
      )
      expect(value.tables['users']?.columns['id']?.notNull).toBe(true)
      expect(value.tables['users']?.constraints['PRIMARY_id']).toEqual({
        type: 'PRIMARY KEY',
        name: 'PRIMARY_id',
        columnNames: ['id'],
      })
    })

    it('integer primary key without autoIncrement', async () => {
      const { value } = await processor(`
        import { sqliteTable, integer } from 'drizzle-orm/sqlite-core';

        export const users = sqliteTable('users', {
          id: integer('id').primaryKey(),
        });
      `)

      expect(value.tables['users']?.columns['id']?.default).toBe(null)
      expect(value.tables['users']?.constraints['PRIMARY_id']).toEqual({
        type: 'PRIMARY KEY',
        name: 'PRIMARY_id',
        columnNames: ['id'],
      })
    })

    it('text with length option', async () => {
      const { value } = await processor(`
        import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

        export const users = sqliteTable('users', {
          id: integer('id').primaryKey({ autoIncrement: true }),
          name: text('name', { length: 255 }).notNull(),
        });
      `)

      expect(value.tables['users']?.columns['name']?.type).toBe('text(255)')
    })

    it('text with enum option is parsed as text (SQLite has no native enum)', async () => {
      const { value } = await processor(`
        import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

        export const users = sqliteTable('users', {
          id: integer('id').primaryKey({ autoIncrement: true }),
          status: text('status', { enum: ['active', 'archived'] }).default('active'),
        });
      `)

      expect(value.tables['users']?.columns['status']?.type).toBe('text')
      expect(value.tables['users']?.columns['status']?.default).toBe('active')
      expect(value.enums).toEqual({})
    })

    it('indexes and composite primary key in array callback form', async () => {
      const { value } = await processor(`
        import { sqliteTable, integer, text, index, uniqueIndex, primaryKey } from 'drizzle-orm/sqlite-core';

        export const users = sqliteTable('users', {
          id: integer('id').primaryKey({ autoIncrement: true }),
          firstName: text('first_name'),
          lastName: text('last_name'),
          email: text('email'),
        }, (table) => [
          index('name_idx').on(table.firstName, table.lastName),
          uniqueIndex('email_idx').on(table.email),
        ]);

        export const userTags = sqliteTable('user_tags', {
          userId: integer('user_id').references(() => users.id).notNull(),
          tag: text('tag').notNull(),
        }, (table) => [
          primaryKey({ columns: [table.userId, table.tag] }),
        ]);
      `)

      expect(value.tables['users']?.indexes['name_idx']).toEqual({
        name: 'name_idx',
        columns: ['first_name', 'last_name'],
        unique: false,
        type: '',
      })
      expect(value.tables['users']?.indexes['email_idx']).toEqual({
        name: 'email_idx',
        columns: ['email'],
        unique: true,
        type: '',
      })
      expect(value.tables['user_tags']?.constraints['user_tags_pkey']).toEqual({
        type: 'PRIMARY KEY',
        name: 'user_tags_pkey',
        columnNames: ['user_id', 'tag'],
      })
    })

    it('unnamed indexes in array callback form do not collide', async () => {
      const { value } = await processor(`
        import { sqliteTable, integer, text, index } from 'drizzle-orm/sqlite-core';

        export const users = sqliteTable('users', {
          id: integer('id').primaryKey({ autoIncrement: true }),
          firstName: text('first_name'),
          email: text('email'),
        }, (table) => [
          index().on(table.firstName),
          index().on(table.email),
        ]);
      `)

      expect(value.tables['users']?.indexes['users_firstName_index']).toEqual({
        name: 'users_firstName_index',
        columns: ['first_name'],
        unique: false,
        type: '',
      })
      expect(value.tables['users']?.indexes['users_email_index']).toEqual({
        name: 'users_email_index',
        columns: ['email'],
        unique: false,
        type: '',
      })
    })

    it('column modes are parsed as underlying SQLite types', async () => {
      const { value } = await processor(`
        import { sqliteTable, integer, text, blob } from 'drizzle-orm/sqlite-core';

        export const users = sqliteTable('users', {
          id: integer('id').primaryKey({ autoIncrement: true }),
          isActive: integer('is_active', { mode: 'boolean' }).default(true),
          createdAt: integer('created_at', { mode: 'timestamp' }),
          settings: text('settings', { mode: 'json' }),
          metadata: blob('metadata', { mode: 'json' }),
        });
      `)

      expect(value.tables['users']?.columns['isActive']?.type).toBe('integer')
      expect(value.tables['users']?.columns['isActive']?.default).toBe(true)
      expect(value.tables['users']?.columns['createdAt']?.type).toBe('integer')
      expect(value.tables['users']?.columns['settings']?.type).toBe('text')
      expect(value.tables['users']?.columns['metadata']?.type).toBe('blob')
    })
  })
})
