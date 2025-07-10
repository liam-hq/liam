import { describe, expect, it } from 'vitest'
import type { Table } from '../../schema/index.js'
import { aColumn, anIndex, aSchema, aTable } from '../../schema/index.js'
import { createParserTestCases } from '../__tests__/index.js'
import { processor as _processor } from './index.js'

describe(_processor, () => {
  const userTable = (override?: Partial<Table>) =>
    aSchema({
      tables: {
        users: aTable({
          name: 'users',
          columns: {
            id: aColumn({
              name: 'id',
              type: 'serial',
              default: 'autoincrement()',
              notNull: true,
            }),
            ...override?.columns,
          },
          indexes: {
            users_pkey: anIndex({
              name: 'users_pkey',
              columns: ['id'],
              unique: true,
            }),
            ...override?.indexes,
          },
          constraints: {
            PRIMARY_id: {
              type: 'PRIMARY KEY',
              name: 'PRIMARY_id',
              columnNames: ['id'],
            },
            ...override?.constraints,
          },
          comment: override?.comment ?? null,
        }),
      },
    })

  const parserTestCases = createParserTestCases(userTable)

  describe('should parse drizzle schema correctly', () => {
    it('basic table with columns', async () => {
      const { value } = await _processor(`
        import { pgTable, serial, varchar } from 'drizzle-orm/pg-core';

        export const users = pgTable('users', {
          id: serial('id').primaryKey(),
          name: varchar('name', { length: 255 }).notNull(),
        });
      `)

      const expected = userTable({
        columns: {
          name: aColumn({
            name: 'name',
            type: 'varchar(255)',
            notNull: true,
          }),
        },
      })

      expect(value).toEqual(expected)
    })

    it('nullable column', async () => {
      const { value } = await _processor(`
        import { pgTable, serial, text } from 'drizzle-orm/pg-core';

        export const users = pgTable('users', {
          id: serial('id').primaryKey(),
          description: text('description'),
        });
      `)

      expect(value).toEqual(parserTestCases.nullable)
    })

    it('default value as string', async () => {
      const { value } = await _processor(`
        import { pgTable, serial, text } from 'drizzle-orm/pg-core';

        export const users = pgTable('users', {
          id: serial('id').primaryKey(),
          description: text('description').default("user's description"),
        });
      `)

      expect(value).toEqual(parserTestCases['default value as string'])
    })

    it('default value as integer', async () => {
      const { value } = await _processor(`
        import { pgTable, serial, integer } from 'drizzle-orm/pg-core';

        export const users = pgTable('users', {
          id: serial('id').primaryKey(),
          age: integer('age').default(30).notNull(),
        });
      `)

      const expected = userTable({
        columns: {
          age: aColumn({
            name: 'age',
            type: 'integer',
            default: 30,
            notNull: true,
          }),
        },
      })

      expect(value).toEqual(expected)
    })

    it('default value as boolean', async () => {
      const { value } = await _processor(`
        import { pgTable, serial, boolean } from 'drizzle-orm/pg-core';

        export const users = pgTable('users', {
          id: serial('id').primaryKey(),
          active: boolean('active').default(true).notNull(),
        });
      `)

      const expected = userTable({
        columns: {
          active: aColumn({
            name: 'active',
            type: 'boolean',
            default: true,
            notNull: true,
          }),
        },
      })

      expect(value).toEqual(expected)
    })

    it('column comment', async () => {
      const { value } = await _processor(`
        import { pgTable, serial, text } from 'drizzle-orm/pg-core';

        export const users = pgTable('users', {
          id: serial('id').primaryKey(),
          description: text('description').$comment('this is description'),
        });
      `)

      expect(value).toEqual(parserTestCases['column comment'])
    })

    it('table comment', async () => {
      const { value } = await _processor(`
        import { pgTable, serial } from 'drizzle-orm/pg-core';

        export const users = pgTable('users', {
          id: serial('id').primaryKey(),
        }).$comment('store our users.');
      `)

      expect(value).toEqual(parserTestCases['table comment'])
    })

    it('unique constraint', async () => {
      const { value } = await _processor(`
        import { pgTable, serial, varchar, unique } from 'drizzle-orm/pg-core';

        export const users = pgTable('users', {
          id: serial('id').primaryKey(),
          email: varchar('email', { length: 255 }).unique(),
        });
      `)

      const expected = userTable({
        columns: {
          email: aColumn({
            name: 'email',
            type: 'varchar(255)',
            notNull: false,
          }),
        },
        constraints: {
          UNIQUE_email: {
            type: 'UNIQUE',
            name: 'UNIQUE_email',
            columnNames: ['email'],
          },
        },
      })

      expect(value).toEqual(expected)
    })

    it('foreign key constraint (one-to-many)', async () => {
      const { value } = await _processor(`
        import { pgTable, serial, integer, varchar } from 'drizzle-orm/pg-core';
        import { relations } from 'drizzle-orm';

        export const users = pgTable('users', {
          id: serial('id').primaryKey(),
          name: varchar('name', { length: 255 }),
        });

        export const posts = pgTable('posts', {
          id: serial('id').primaryKey(),
          userId: integer('user_id').references(() => users.id),
          title: varchar('title', { length: 255 }),
        });

        export const usersRelations = relations(users, ({ many }) => ({
          posts: many(posts),
        }));

        export const postsRelations = relations(posts, ({ one }) => ({
          user: one(users, {
            fields: [posts.userId],
            references: [users.id],
          }),
        }));
      `)

      expect(value.tables['posts']?.constraints).toHaveProperty(
        'posts_user_id_users_id_fk',
      )
      expect(
        value.tables['posts']?.constraints['posts_user_id_users_id_fk'],
      ).toEqual({
        type: 'FOREIGN KEY',
        name: 'posts_user_id_users_id_fk',
        columnName: 'user_id',
        targetTableName: 'users',
        targetColumnName: 'id',
        updateConstraint: 'NO_ACTION',
        deleteConstraint: 'NO_ACTION',
      })
    })

    it('foreign key constraint (one-to-one)', async () => {
      const { value } = await _processor(`
        import { pgTable, serial, integer, varchar } from 'drizzle-orm/pg-core';
        import { relations } from 'drizzle-orm';

        export const users = pgTable('users', {
          id: serial('id').primaryKey(),
          name: varchar('name', { length: 255 }),
        });

        export const profiles = pgTable('profiles', {
          id: serial('id').primaryKey(),
          userId: integer('user_id').references(() => users.id).unique(),
          bio: varchar('bio', { length: 500 }),
        });

        export const usersRelations = relations(users, ({ one }) => ({
          profile: one(profiles, {
            fields: [users.id],
            references: [profiles.userId],
          }),
        }));

        export const profilesRelations = relations(profiles, ({ one }) => ({
          user: one(users, {
            fields: [profiles.userId],
            references: [users.id],
          }),
        }));
      `)

      expect(value.tables['profiles']?.constraints).toHaveProperty(
        'profiles_user_id_users_id_fk',
      )
      expect(
        value.tables['profiles']?.constraints['profiles_user_id_users_id_fk'],
      ).toEqual({
        type: 'FOREIGN KEY',
        name: 'profiles_user_id_users_id_fk',
        columnName: 'user_id',
        targetTableName: 'users',
        targetColumnName: 'id',
        updateConstraint: 'NO_ACTION',
        deleteConstraint: 'NO_ACTION',
      })

      // Verify unique constraint for one-to-one relationship
      expect(value.tables['profiles']?.constraints).toHaveProperty(
        'UNIQUE_user_id',
      )
      expect(value.tables['profiles']?.constraints['UNIQUE_user_id']).toEqual({
        type: 'UNIQUE',
        name: 'UNIQUE_user_id',
        columnNames: ['user_id'],
      })

      // Note: inline .unique() creates constraint only, not index
    })

    it('foreign key constraint with cascade actions', async () => {
      const { value } = await _processor(`
        import { pgTable, serial, integer, varchar } from 'drizzle-orm/pg-core';

        export const users = pgTable('users', {
          id: serial('id').primaryKey(),
          name: varchar('name', { length: 255 }),
        });

        export const posts = pgTable('posts', {
          id: serial('id').primaryKey(),
          userId: integer('user_id').references(() => users.id, {
            onDelete: 'cascade',
            onUpdate: 'restrict',
          }),
          title: varchar('title', { length: 255 }),
        });
      `)

      expect(
        value.tables['posts']?.constraints['posts_user_id_users_id_fk'],
      ).toEqual({
        type: 'FOREIGN KEY',
        name: 'posts_user_id_users_id_fk',
        columnName: 'user_id',
        targetTableName: 'users',
        targetColumnName: 'id',
        updateConstraint: 'RESTRICT',
        deleteConstraint: 'CASCADE',
      })
    })

    it('many-to-many relationship with junction table', async () => {
      const { value } = await _processor(`
        import { pgTable, serial, integer, varchar, primaryKey } from 'drizzle-orm/pg-core';
        import { relations } from 'drizzle-orm';

        export const users = pgTable('users', {
          id: serial('id').primaryKey(),
          name: varchar('name', { length: 255 }),
        });

        export const tags = pgTable('tags', {
          id: serial('id').primaryKey(),
          name: varchar('name', { length: 100 }).unique(),
        });

        export const userTags = pgTable('user_tags', {
          userId: integer('user_id').references(() => users.id).notNull(),
          tagId: integer('tag_id').references(() => tags.id).notNull(),
        }, (table) => ({
          pk: primaryKey({ columns: [table.userId, table.tagId] }),
        }));

        export const usersRelations = relations(users, ({ many }) => ({
          userTags: many(userTags),
        }));

        export const tagsRelations = relations(tags, ({ many }) => ({
          userTags: many(userTags),
        }));

        export const userTagsRelations = relations(userTags, ({ one }) => ({
          user: one(users, {
            fields: [userTags.userId],
            references: [users.id],
          }),
          tag: one(tags, {
            fields: [userTags.tagId],
            references: [tags.id],
          }),
        }));
      `)

      // Verify junction table exists
      expect(value.tables).toHaveProperty('user_tags')

      // Verify foreign key constraints in junction table
      expect(value.tables['user_tags']?.constraints).toHaveProperty(
        'user_tags_user_id_users_id_fk',
      )
      expect(
        value.tables['user_tags']?.constraints['user_tags_user_id_users_id_fk'],
      ).toEqual({
        type: 'FOREIGN KEY',
        name: 'user_tags_user_id_users_id_fk',
        columnName: 'user_id',
        targetTableName: 'users',
        targetColumnName: 'id',
        updateConstraint: 'NO_ACTION',
        deleteConstraint: 'NO_ACTION',
      })

      expect(value.tables['user_tags']?.constraints).toHaveProperty(
        'user_tags_tag_id_tags_id_fk',
      )
      expect(
        value.tables['user_tags']?.constraints['user_tags_tag_id_tags_id_fk'],
      ).toEqual({
        type: 'FOREIGN KEY',
        name: 'user_tags_tag_id_tags_id_fk',
        columnName: 'tag_id',
        targetTableName: 'tags',
        targetColumnName: 'id',
        updateConstraint: 'NO_ACTION',
        deleteConstraint: 'NO_ACTION',
      })

      // Verify composite primary key
      expect(value.tables['user_tags']?.constraints).toHaveProperty(
        'user_tags_pkey',
      )
      expect(value.tables['user_tags']?.constraints['user_tags_pkey']).toEqual({
        type: 'PRIMARY KEY',
        name: 'user_tags_pkey',
        columnNames: ['user_id', 'tag_id'],
      })

      // Verify composite primary key index
      expect(value.tables['user_tags']?.indexes).toHaveProperty(
        'user_tags_pkey',
      )
      expect(value.tables['user_tags']?.indexes['user_tags_pkey']).toEqual({
        name: 'user_tags_pkey',
        columns: ['user_id', 'tag_id'],
        unique: true,
        type: '',
      })

      // Verify tags table has unique constraint
      expect(value.tables['tags']?.constraints).toHaveProperty('UNIQUE_name')
      expect(value.tables['tags']?.constraints['UNIQUE_name']).toEqual({
        type: 'UNIQUE',
        name: 'UNIQUE_name',
        columnNames: ['name'],
      })
    })

    it('composite index', async () => {
      const { value } = await _processor(`
        import { pgTable, serial, varchar, index } from 'drizzle-orm/pg-core';

        export const users = pgTable('users', {
          id: serial('id').primaryKey(),
          firstName: varchar('first_name', { length: 255 }),
          lastName: varchar('last_name', { length: 255 }),
          email: varchar('email', { length: 255 }),
        }, (table) => ({
          nameIdx: index('name_idx').on(table.firstName, table.lastName),
          emailIdx: index('email_idx').on(table.email),
        }));
      `)

      expect(value.tables['users']?.indexes).toHaveProperty('name_idx')
      expect(value.tables['users']?.indexes['name_idx']).toEqual(
        anIndex({
          name: 'name_idx',
          columns: ['first_name', 'last_name'],
          unique: false,
        }),
      )
    })

    it('unique index', async () => {
      const { value } = await _processor(`
        import { pgTable, serial, varchar, uniqueIndex } from 'drizzle-orm/pg-core';

        export const users = pgTable('users', {
          id: serial('id').primaryKey(),
          email: varchar('email', { length: 255 }),
        }, (table) => ({
          emailIdx: uniqueIndex('email_unique_idx').on(table.email),
        }));
      `)

      expect(value.tables['users']?.indexes['email_unique_idx']).toEqual(
        anIndex({
          name: 'email_unique_idx',
          columns: ['email'],
          unique: true,
        }),
      )
    })

    it('multiple data types', async () => {
      const { value } = await _processor(`
        import { 
          pgTable, 
          serial, 
          varchar, 
          text, 
          integer, 
          bigint, 
          boolean, 
          timestamp, 
          decimal,
          json
        } from 'drizzle-orm/pg-core';

        export const users = pgTable('users', {
          id: serial('id').primaryKey(),
          name: varchar('name', { length: 255 }).notNull(),
          bio: text('bio'),
          age: integer('age'),
          salary: bigint('salary', { mode: 'number' }),
          isActive: boolean('is_active').default(true),
          createdAt: timestamp('created_at').defaultNow(),
          score: decimal('score', { precision: 10, scale: 2 }),
          metadata: json('metadata'),
        });
      `)

      const expected = userTable({
        columns: {
          name: aColumn({
            name: 'name',
            type: 'varchar(255)',
            notNull: true,
          }),
          bio: aColumn({
            name: 'bio',
            type: 'text',
            notNull: false,
          }),
          age: aColumn({
            name: 'age',
            type: 'integer',
            notNull: false,
          }),
          salary: aColumn({
            name: 'salary',
            type: 'bigint',
            notNull: false,
          }),
          isActive: aColumn({
            name: 'is_active',
            type: 'boolean',
            default: true,
            notNull: false,
          }),
          createdAt: aColumn({
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
            notNull: false,
          }),
          score: aColumn({
            name: 'score',
            type: 'decimal(10,2)',
            notNull: false,
          }),
          metadata: aColumn({
            name: 'metadata',
            type: 'json',
            notNull: false,
          }),
        },
      })

      expect(value).toEqual(expected)
    })

    it('enum type', async () => {
      const { value } = await _processor(`
        import { pgTable, serial, varchar, pgEnum } from 'drizzle-orm/pg-core';

        export const roleEnum = pgEnum('role', ['user', 'admin']);

        export const users = pgTable('users', {
          id: serial('id').primaryKey(),
          name: varchar('name', { length: 255 }),
          role: roleEnum('role').default('user'),
        });
      `)

      const expected = userTable({
        columns: {
          name: aColumn({
            name: 'name',
            type: 'varchar(255)',
            notNull: false,
          }),
          role: aColumn({
            name: 'role',
            type: 'role',
            default: 'user',
            notNull: false,
          }),
        },
      })

      expect(value).toEqual(expected)
    })

    it('one-to-one relation without explicit fields/references', async () => {
      const { value } = await _processor(`
        import { pgTable, serial, integer, varchar } from 'drizzle-orm/pg-core';
        import { relations } from 'drizzle-orm';

        export const users = pgTable('users', {
          id: serial('id').primaryKey(),
          name: varchar('name', { length: 255 }),
        });

        export const instructors = pgTable('instructors', {
          id: serial('id').primaryKey(),
          userId: integer('user_id').references(() => users.id).unique(),
          specialization: varchar('specialization', { length: 255 }),
        });

        export const usersRelations = relations(users, ({ one, many }) => ({
          instructor: one(instructors), // 1:1, fields/references omitted
        }));

        export const instructorsRelations = relations(instructors, ({ one, many }) => ({
          user: one(users, {
            fields: [instructors.userId],
            references: [users.id],
          }), // 1:1, reverse direction
        }));
      `)

      // Verify both tables exist
      expect(value.tables).toHaveProperty('users')
      expect(value.tables).toHaveProperty('instructors')

      // Verify foreign key constraint
      expect(value.tables['instructors']?.constraints).toHaveProperty(
        'instructors_user_id_users_id_fk',
      )
      expect(
        value.tables['instructors']?.constraints[
          'instructors_user_id_users_id_fk'
        ],
      ).toEqual({
        type: 'FOREIGN KEY',
        name: 'instructors_user_id_users_id_fk',
        columnName: 'user_id',
        targetTableName: 'users',
        targetColumnName: 'id',
        updateConstraint: 'NO_ACTION',
        deleteConstraint: 'NO_ACTION',
      })

      // Verify unique constraint for one-to-one relationship
      expect(value.tables['instructors']?.constraints).toHaveProperty(
        'UNIQUE_user_id',
      )
      expect(
        value.tables['instructors']?.constraints['UNIQUE_user_id'],
      ).toEqual({
        type: 'UNIQUE',
        name: 'UNIQUE_user_id',
        columnNames: ['user_id'],
      })
    })

    it('test actual schema from test_schema.ts pattern', async () => {
      const { value } = await _processor(`
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
          uuid: uuid('uuid').defaultRandom().notNull().unique(),
          name: text('name').notNull(),
          email: text('email').notNull().unique(),
          passwordHash: text('password_hash').notNull(),
          role: userRoleEnum('role').default('student').notNull(),
          bio: text('bio'),
          profilePictureUrl: text('profile_picture_url'),
          createdAt: timestamp('created_at').defaultNow().notNull(),
          updatedAt: timestamp('updated_at').defaultNow().notNull(),
        });

        export const instructors = pgTable('instructors', {
          id: serial('id').primaryKey(),
          userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
          specialization: text('specialization'),
          experienceYears: integer('experience_years').default(0).notNull(),
          externalLink: text('external_link'),
        });

        export const usersRelations = relations(users, ({ one, many }) => ({
          instructor: one(instructors), // users has 1:1 with instructors
        }));

        export const instructorsRelations = relations(instructors, ({ one, many }) => ({
          user: one(users, {
            fields: [instructors.userId],
            references: [users.id],
          }), // instructors has 1:1 with users (reverse direction)
        }));
      `)

      // Focus on the key relationship elements

      // The critical constraint for 1:1 relationship
      expect(value.tables['instructors']?.constraints).toHaveProperty(
        'UNIQUE_user_id',
      )
      expect(value.tables['instructors']?.constraints).toHaveProperty(
        'instructors_user_id_users_id_fk',
      )

      // With unique constraint + foreign key, this establishes a proper 1:1 relationship
      const uniqueConstraint =
        value.tables['instructors']?.constraints['UNIQUE_user_id']
      const foreignKeyConstraint =
        value.tables['instructors']?.constraints[
          'instructors_user_id_users_id_fk'
        ]

      expect(uniqueConstraint?.type).toBe('UNIQUE')
      expect(foreignKeyConstraint?.type).toBe('FOREIGN KEY')

      // Type guard to check if it's a ForeignKeyConstraint
      if (foreignKeyConstraint && foreignKeyConstraint.type === 'FOREIGN KEY') {
        expect(foreignKeyConstraint.targetTableName).toBe('users')
      }
    })

    it('multiple PostgreSQL schemas', async () => {
      const { value } = await _processor(`
        import { pgTable, serial, varchar, integer } from 'drizzle-orm/pg-core';
        import { pgSchema } from 'drizzle-orm/pg-core';

        // Define schemas
        export const authSchema = pgSchema('auth');
        export const publicSchema = pgSchema('public');

        // Auth schema table
        export const authUsers = authSchema.table('users', {
          id: serial('id').primaryKey(),
          email: varchar('email', { length: 255 }).notNull(),
        });

        // Public schema tables with foreign keys
        export const publicPosts = publicSchema.table('posts', {
          id: serial('id').primaryKey(),
          userId: integer('user_id').references(() => authUsers.id),
          title: varchar('title', { length: 255 }),
        });

        export const publicComments = publicSchema.table('comments', {
          id: serial('id').primaryKey(),
          postId: integer('post_id').references(() => publicPosts.id),
          userId: integer('user_id').references(() => authUsers.id),
        });
      `)

      // Check that all tables are parsed
      expect(Object.keys(value.tables)).toHaveLength(3)
      expect(value.tables).toHaveProperty('users')
      expect(value.tables).toHaveProperty('posts')
      expect(value.tables).toHaveProperty('comments')

      // Verify foreign key constraints across schemas
      const postsFK =
        value.tables['posts']?.constraints['posts_user_id_authUsers_id_fk']
      expect(postsFK).toBeDefined()
      if (postsFK && postsFK.type === 'FOREIGN KEY') {
        expect(postsFK.targetTableName).toBe('users') // Should reference table name, not variable name
      }

      // Verify multiple FKs in one table
      const commentsFKs = value.tables['comments']?.constraints || {}
      const foreignKeyCount = Object.values(commentsFKs).filter(
        (c) => c.type === 'FOREIGN KEY',
      ).length
      expect(foreignKeyCount).toBe(2)
    })

    it('foreign key with different column names (JS property vs DB column)', async () => {
      const { value } = await _processor(`
        import { pgTable, serial, varchar, integer } from 'drizzle-orm/pg-core';

        export const users = pgTable('users', {
          userId: serial('user_id').primaryKey(), // JS property: userId, DB column: user_id
          email: varchar('email', { length: 255 }).notNull(),
        });

        export const posts = pgTable('posts', {
          id: serial('id').primaryKey(),
          authorId: integer('author_id').references(() => users.userId), // Referencing JS property
          title: varchar('title', { length: 255 }),
        });
      `)

      // Check that foreign key correctly references the actual DB column name
      // Find the FK constraint (name might be different)
      const constraints = value.tables['posts']?.constraints || {}
      const fkConstraint = Object.values(constraints).find(
        (c) => c.type === 'FOREIGN KEY',
      )

      expect(fkConstraint).toBeDefined()
      if (fkConstraint && fkConstraint.type === 'FOREIGN KEY') {
        expect(fkConstraint.targetColumnName).toBe('user_id') // Should be DB column name, not JS property name
      }
    })
  })
})
