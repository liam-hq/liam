import { describe, expect, it } from 'vitest'
import { createParserTestCases } from '@/parser/__tests__/index.js'
import type { Constraint, Table } from '@/schema/index.js'
import { aColumn, anIndex, aSchema, aTable } from '@/schema/index.js'
import { processor as mysqlProcessor } from '../mysql/index.js'
import { processor as postgresProcessor } from '../postgres/index.js'

/**
 * Unified test suite for MySQL and PostgreSQL Drizzle parsers
 * This test suite reduces code duplication by running the same test cases
 * against both database parsers with parameterized configurations.
 */

// Database configuration for parameterized tests
const dbConfigs = {
  mysql: {
    name: 'MySQL',
    processor: mysqlProcessor,
    imports: {
      core: 'drizzle-orm/mysql-core',
      relations: 'drizzle-orm',
    },
    functions: {
      table: 'mysqlTable',
      enum: 'mysqlEnum',
      index: 'index',
      uniqueIndex: 'uniqueIndex',
      primaryKey: 'primaryKey',
      check: 'check',
    },
    types: {
      id: 'int',
      idColumn: () => "int('id').primaryKey().autoincrement()",
      varchar: 'varchar',
      text: 'text',
      integer: 'int',
      bigint: 'bigint',
      boolean: 'boolean',
      timestamp: 'timestamp',
      decimal: 'decimal',
      json: 'json',
    },
    expectedTypes: {
      id: 'int',
      varchar: (length: number) => `varchar(${length})`,
      text: 'text',
      integer: 'int',
      bigint: 'bigint',
      boolean: 'boolean',
      timestamp: 'timestamp',
      decimal: (precision: number, scale: number) =>
        `decimal(${precision},${scale})`,
      json: 'json',
      enum: 'enum',
    },
    userTableBase: (override?: Partial<Table>) =>
      aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({
                name: 'id',
                type: 'int',
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
      }),
  },
  postgres: {
    name: 'PostgreSQL',
    processor: postgresProcessor,
    imports: {
      core: 'drizzle-orm/pg-core',
      relations: 'drizzle-orm',
    },
    functions: {
      table: 'pgTable',
      enum: 'pgEnum',
      index: 'index',
      uniqueIndex: 'uniqueIndex',
      primaryKey: 'primaryKey',
      check: 'check',
    },
    types: {
      id: 'serial',
      idColumn: () => "serial('id').primaryKey()",
      varchar: 'varchar',
      text: 'text',
      integer: 'integer',
      bigint: 'bigint',
      boolean: 'boolean',
      timestamp: 'timestamp',
      decimal: 'decimal',
      json: 'json',
    },
    expectedTypes: {
      id: 'serial',
      varchar: (length: number) => `varchar(${length})`,
      text: 'text',
      integer: 'integer',
      bigint: 'bigint',
      boolean: 'boolean',
      timestamp: 'timestamp',
      decimal: (precision: number, scale: number) =>
        `decimal(${precision},${scale})`,
      json: 'json',
      enum: (name: string) => name,
    },
    userTableBase: (override?: Partial<Table>) =>
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
      }),
  },
} as const

describe.each(Object.entries(dbConfigs))(
  '%s Drizzle Parser',
  (dbType, config) => {
    const parserTestCases = createParserTestCases(config.userTableBase)

    describe(`should parse ${config.name} schema correctly`, () => {
      it('basic table with columns', async () => {
        const schema = `
        import { ${config.functions.table}, ${config.types.id}, varchar } from '${config.imports.core}';

        export const users = ${config.functions.table}('users', {
          id: ${config.types.idColumn()},
          name: varchar('name', { length: 255 }).notNull(),
        });
      `

        const { value } = await config.processor(schema)

        const expected = config.userTableBase({
          columns: {
            name: aColumn({
              name: 'name',
              type: config.expectedTypes.varchar(255),
              notNull: true,
            }),
          },
        })

        expect(value).toEqual(expected)
      })

      it('nullable column', async () => {
        const schema = `
        import { ${config.functions.table}, ${config.types.id}, text } from '${config.imports.core}';

        export const users = ${config.functions.table}('users', {
          id: ${config.types.idColumn()},
          description: text('description'),
        });
      `

        const { value } = await config.processor(schema)
        expect(value).toEqual(parserTestCases.nullable)
      })

      it('default value as string', async () => {
        const schema = `
        import { ${config.functions.table}, ${config.types.id}, text } from '${config.imports.core}';

        export const users = ${config.functions.table}('users', {
          id: ${config.types.idColumn()},
          description: text('description').default("user's description"),
        });
      `

        const { value } = await config.processor(schema)
        expect(value).toEqual(parserTestCases['default value as string'])
      })

      it('default value as integer', async () => {
        const schema = `
        import { ${config.functions.table}, ${config.types.id}, ${config.types.integer} } from '${config.imports.core}';

        export const users = ${config.functions.table}('users', {
          id: ${config.types.idColumn()},
          age: ${config.types.integer}('age').default(30).notNull(),
        });
      `

        const { value } = await config.processor(schema)

        const expected = config.userTableBase({
          columns: {
            age: aColumn({
              name: 'age',
              type: config.expectedTypes.integer,
              default: 30,
              notNull: true,
            }),
          },
        })

        expect(value).toEqual(expected)
      })

      it('default value as boolean', async () => {
        const schema = `
        import { ${config.functions.table}, ${config.types.id}, boolean } from '${config.imports.core}';

        export const users = ${config.functions.table}('users', {
          id: ${config.types.idColumn()},
          active: boolean('active').default(true).notNull(),
        });
      `

        const { value } = await config.processor(schema)

        const expected = config.userTableBase({
          columns: {
            active: aColumn({
              name: 'active',
              type: config.expectedTypes.boolean,
              default: true,
              notNull: true,
            }),
          },
        })

        expect(value).toEqual(expected)
      })

      it('column comment', async () => {
        const schema = `
        import { ${config.functions.table}, ${config.types.id}, text } from '${config.imports.core}';

        export const users = ${config.functions.table}('users', {
          id: ${config.types.idColumn()},
          description: text('description').$comment('this is description'),
        });
      `

        const { value } = await config.processor(schema)
        expect(value).toEqual(parserTestCases['column comment'])
      })

      it('table comment', async () => {
        const schema = `
        import { ${config.functions.table}, ${config.types.id} } from '${config.imports.core}';

        export const users = ${config.functions.table}('users', {
          id: ${config.types.idColumn()},
        }).$comment('store our users.');
      `

        const { value } = await config.processor(schema)
        expect(value).toEqual(parserTestCases['table comment'])
      })

      it('unique constraint', async () => {
        const schema = `
        import { ${config.functions.table}, ${config.types.id}, varchar } from '${config.imports.core}';

        export const users = ${config.functions.table}('users', {
          id: ${config.types.idColumn()},
          email: varchar('email', { length: 255 }).unique(),
        });
      `

        const { value } = await config.processor(schema)

        const expected = config.userTableBase({
          columns: {
            email: aColumn({
              name: 'email',
              type: config.expectedTypes.varchar(255),
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
        const foreignKeyRef = `${config.types.integer}('user_id').references(() => users.id)`

        const schema = `
        import { ${config.functions.table}, ${config.types.id}, ${config.types.integer}, varchar } from '${config.imports.core}';
        import { relations } from '${config.imports.relations}';

        export const users = ${config.functions.table}('users', {
          id: ${config.types.idColumn()},
          name: varchar('name', { length: 255 }),
        });

        export const posts = ${config.functions.table}('posts', {
          id: ${config.types.idColumn()},
          userId: ${foreignKeyRef},
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
      `

        const { value } = await config.processor(schema)

        expect(value.tables['posts']?.constraints).toHaveProperty(
          'posts_user_id_users_id_fk',
        )
        expect(
          value.tables['posts']?.constraints['posts_user_id_users_id_fk'],
        ).toEqual({
          type: 'FOREIGN KEY',
          name: 'posts_user_id_users_id_fk',
          columnNames: ['user_id'],
          targetTableName: 'users',
          targetColumnNames: ['id'],
          updateConstraint: 'NO_ACTION',
          deleteConstraint: 'NO_ACTION',
        })
      })

      // Continue with remaining test cases...
      // For brevity, I'll add a few more key tests and mark the TODO for completing all 20 tests

      it('composite index', async () => {
        const schema = `
        import { ${config.functions.table}, ${config.types.id}, varchar, ${config.functions.index} } from '${config.imports.core}';

        export const users = ${config.functions.table}('users', {
          id: ${config.types.idColumn()},
          firstName: varchar('first_name', { length: 255 }),
          lastName: varchar('last_name', { length: 255 }),
          email: varchar('email', { length: 255 }),
        }, (table) => ({
          nameIdx: ${config.functions.index}('name_idx').on(table.firstName, table.lastName),
          emailIdx: ${config.functions.index}('email_idx').on(table.email),
        }));
      `

        const { value } = await config.processor(schema)

        expect(value.tables['users']?.indexes).toHaveProperty('name_idx')
        expect(value.tables['users']?.indexes['name_idx']).toEqual(
          anIndex({
            name: 'name_idx',
            columns: ['first_name', 'last_name'],
            unique: false,
          }),
        )
      })

      it('multiple data types', async () => {
        const schema = `
        import { 
          ${config.functions.table}, 
          ${config.types.id}, 
          varchar, 
          text, 
          ${config.types.integer}, 
          ${config.types.bigint}, 
          boolean, 
          timestamp, 
          decimal,
          ${config.types.json}
        } from '${config.imports.core}';

        export const users = ${config.functions.table}('users', {
          id: ${config.types.idColumn()},
          name: varchar('name', { length: 255 }).notNull(),
          bio: text('bio'),
          age: ${config.types.integer}('age'),
          salary: ${config.types.bigint}('salary', { mode: 'number' }),
          isActive: boolean('is_active').default(true),
          createdAt: timestamp('created_at').defaultNow(),
          score: decimal('score', { precision: 10, scale: 2 }),
          metadata: ${config.types.json}('metadata'),
        });
      `

        const { value } = await config.processor(schema)

        const expected = config.userTableBase({
          columns: {
            name: aColumn({
              name: 'name',
              type: config.expectedTypes.varchar(255),
              notNull: true,
            }),
            bio: aColumn({
              name: 'bio',
              type: config.expectedTypes.text,
              notNull: false,
            }),
            age: aColumn({
              name: 'age',
              type: config.expectedTypes.integer,
              notNull: false,
            }),
            salary: aColumn({
              name: 'salary',
              type: config.expectedTypes.bigint,
              notNull: false,
            }),
            isActive: aColumn({
              name: 'is_active',
              type: config.expectedTypes.boolean,
              default: true,
              notNull: false,
            }),
            createdAt: aColumn({
              name: 'created_at',
              type: config.expectedTypes.timestamp,
              default: 'now()',
              notNull: false,
            }),
            score: aColumn({
              name: 'score',
              type: config.expectedTypes.decimal(10, 2),
              notNull: false,
            }),
            metadata: aColumn({
              name: 'metadata',
              type: config.expectedTypes.json,
              notNull: false,
            }),
          },
        })

        expect(value).toEqual(expected)
      })

      it('enum type', async () => {
        const enumFunction = config.functions.enum
        const enumType = dbType === 'mysql' ? 'enum' : 'role'

        const schema = `
        import { ${config.functions.table}, ${config.types.id}, varchar, ${enumFunction} } from '${config.imports.core}';

        ${dbType === 'postgres' ? `export const roleEnum = ${enumFunction}('role', ['user', 'admin']);` : ''}

        export const users = ${config.functions.table}('users', {
          id: ${config.types.idColumn()},
          name: varchar('name', { length: 255 }),
          role: ${
            dbType === 'mysql'
              ? `${enumFunction}('role', ['user', 'admin']).default('user')`
              : `roleEnum('role').default('user')`
          },
        });
      `

        const { value } = await config.processor(schema)

        const expected = config.userTableBase({
          columns: {
            name: aColumn({
              name: 'name',
              type: config.expectedTypes.varchar(255),
              notNull: false,
            }),
            role: aColumn({
              name: 'role',
              type: enumType,
              default: 'user',
              notNull: false,
            }),
          },
        })

        expect(value).toEqual(expected)
      })

      it('foreign key constraint (one-to-one)', async () => {
        const schema = `
        import { ${config.functions.table}, ${config.types.id}, ${config.types.integer}, varchar } from '${config.imports.core}';
        import { relations } from '${config.imports.relations}';

        export const users = ${config.functions.table}('users', {
          id: ${config.types.idColumn()},
          name: varchar('name', { length: 255 }),
        });

        export const profiles = ${config.functions.table}('profiles', {
          id: ${config.types.idColumn()},
          userId: ${config.types.integer}('user_id').references(() => users.id).unique(),
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
      `

        const { value } = await config.processor(schema)

        expect(value.tables['profiles']?.constraints).toHaveProperty(
          'profiles_user_id_users_id_fk',
        )
        expect(
          value.tables['profiles']?.constraints['profiles_user_id_users_id_fk'],
        ).toEqual({
          type: 'FOREIGN KEY',
          name: 'profiles_user_id_users_id_fk',
          columnNames: ['user_id'],
          targetTableName: 'users',
          targetColumnNames: ['id'],
          updateConstraint: 'NO_ACTION',
          deleteConstraint: 'NO_ACTION',
        })

        // Verify unique constraint for one-to-one relationship
        expect(value.tables['profiles']?.constraints).toHaveProperty(
          'UNIQUE_user_id',
        )
        expect(value.tables['profiles']?.constraints['UNIQUE_user_id']).toEqual(
          {
            type: 'UNIQUE',
            name: 'UNIQUE_user_id',
            columnNames: ['user_id'],
          },
        )
      })

      it('foreign key constraint with cascade actions', async () => {
        const schema = `
        import { ${config.functions.table}, ${config.types.id}, ${config.types.integer}, varchar } from '${config.imports.core}';

        export const users = ${config.functions.table}('users', {
          id: ${config.types.idColumn()},
          name: varchar('name', { length: 255 }),
        });

        export const posts = ${config.functions.table}('posts', {
          id: ${config.types.idColumn()},
          userId: ${config.types.integer}('user_id').references(() => users.id, {
            onDelete: 'cascade',
            onUpdate: 'restrict',
          }),
          title: varchar('title', { length: 255 }),
        });
      `

        const { value } = await config.processor(schema)

        expect(
          value.tables['posts']?.constraints['posts_user_id_users_id_fk'],
        ).toEqual({
          type: 'FOREIGN KEY',
          name: 'posts_user_id_users_id_fk',
          columnNames: ['user_id'],
          targetTableName: 'users',
          targetColumnNames: ['id'],
          updateConstraint: 'RESTRICT',
          deleteConstraint: 'CASCADE',
        })
      })

      it('many-to-many relationship with junction table', async () => {
        const schema = `
        import { ${config.functions.table}, ${config.types.id}, ${config.types.integer}, varchar, ${config.functions.primaryKey} } from '${config.imports.core}';
        import { relations } from '${config.imports.relations}';

        export const users = ${config.functions.table}('users', {
          id: ${config.types.idColumn()},
          name: varchar('name', { length: 255 }),
        });

        export const tags = ${config.functions.table}('tags', {
          id: ${config.types.idColumn()},
          name: varchar('name', { length: 100 }).unique(),
        });

        export const userTags = ${config.functions.table}('user_tags', {
          userId: ${config.types.integer}('user_id').references(() => users.id).notNull(),
          tagId: ${config.types.integer}('tag_id').references(() => tags.id).notNull(),
        }, (table) => ({
          pk: ${config.functions.primaryKey}({ columns: [table.userId, table.tagId] }),
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
      `

        const { value } = await config.processor(schema)

        // Verify junction table exists
        expect(value.tables).toHaveProperty('user_tags')

        // Verify foreign key constraints in junction table
        expect(value.tables['user_tags']?.constraints).toHaveProperty(
          'user_tags_user_id_users_id_fk',
        )
        expect(
          value.tables['user_tags']?.constraints[
            'user_tags_user_id_users_id_fk'
          ],
        ).toEqual({
          type: 'FOREIGN KEY',
          name: 'user_tags_user_id_users_id_fk',
          columnNames: ['user_id'],
          targetTableName: 'users',
          targetColumnNames: ['id'],
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
          columnNames: ['tag_id'],
          targetTableName: 'tags',
          targetColumnNames: ['id'],
          updateConstraint: 'NO_ACTION',
          deleteConstraint: 'NO_ACTION',
        })

        // Verify composite primary key
        expect(value.tables['user_tags']?.constraints).toHaveProperty(
          'user_tags_pkey',
        )
        expect(
          value.tables['user_tags']?.constraints['user_tags_pkey'],
        ).toEqual({
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

      it('unique index', async () => {
        const schema = `
        import { ${config.functions.table}, ${config.types.id}, varchar, ${config.functions.uniqueIndex} } from '${config.imports.core}';

        export const users = ${config.functions.table}('users', {
          id: ${config.types.idColumn()},
          email: varchar('email', { length: 255 }),
        }, (table) => ({
          emailIdx: ${config.functions.uniqueIndex}('email_unique_idx').on(table.email),
        }));
      `

        const { value } = await config.processor(schema)

        expect(value.tables['users']?.indexes['email_unique_idx']).toEqual(
          anIndex({
            name: 'email_unique_idx',
            columns: ['email'],
            unique: true,
          }),
        )
      })

      it('one-to-one relation without explicit fields/references', async () => {
        const schema = `
        import { ${config.functions.table}, ${config.types.id}, ${config.types.integer}, varchar } from '${config.imports.core}';
        import { relations } from '${config.imports.relations}';

        export const users = ${config.functions.table}('users', {
          id: ${config.types.idColumn()},
          name: varchar('name', { length: 255 }),
        });

        export const instructors = ${config.functions.table}('instructors', {
          id: ${config.types.idColumn()},
          userId: ${config.types.integer}('user_id').references(() => users.id).unique(),
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
      `

        const { value } = await config.processor(schema)

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
          columnNames: ['user_id'],
          targetTableName: 'users',
          targetColumnNames: ['id'],
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

      it('foreign key with different column names (JS property vs DB column)', async () => {
        const userIdColumn =
          dbType === 'mysql'
            ? `${config.types.id}('user_id').primaryKey().autoincrement()`
            : `${config.types.id}('user_id').primaryKey()`

        const schema = `
        import { ${config.functions.table}, ${config.types.id}, varchar, ${config.types.integer} } from '${config.imports.core}';

        export const users = ${config.functions.table}('users', {
          userId: ${userIdColumn}, // JS property: userId, DB column: user_id
          email: varchar('email', { length: 255 }).notNull(),
        });

        export const posts = ${config.functions.table}('posts', {
          id: ${config.types.idColumn()},
          authorId: ${config.types.integer}('author_id').references(() => users.userId), // Referencing JS property
          title: varchar('title', { length: 255 }),
        });
      `

        const { value } = await config.processor(schema)

        // Check that foreign key correctly references the actual DB column name
        const constraints = value.tables['posts']?.constraints || {}
        const fkConstraint = Object.values(constraints).find(
          (c: Constraint) => c.type === 'FOREIGN KEY',
        )

        expect(fkConstraint).toBeDefined()
        if (fkConstraint && fkConstraint.type === 'FOREIGN KEY') {
          expect(fkConstraint.targetColumnNames).toEqual(['user_id']) // Should be DB column name, not JS property name
        }
      })

      it('check constraints', async () => {
        const schema = `
          import { ${config.functions.table}, ${config.types.id}, varchar, ${config.functions.check} } from '${config.imports.core}';
          import { sql } from '${config.imports.relations}';

          export const users = ${config.functions.table}('users', {
            id: ${config.types.idColumn()},
            age: ${config.types.integer}('age'),
            username: varchar('username', { length: 50 }).notNull(),
          }, (table) => ({
            ageCheck: ${config.functions.check}('users_age_check', sql\`age >= 0 AND age <= 150\`),
            usernameCheck: ${config.functions.check}('users_username_check', sql\`CHAR_LENGTH(username) >= 3\`),
          }));
        `

        const { value } = await config.processor(schema)

        expect(value.tables['users']?.constraints).toHaveProperty(
          'users_age_check',
        )
        expect(value.tables['users']?.constraints['users_age_check']).toEqual({
          type: 'CHECK',
          name: 'users_age_check',
          detail: 'age >= 0 AND age <= 150',
        })

        expect(value.tables['users']?.constraints).toHaveProperty(
          'users_username_check',
        )
        expect(
          value.tables['users']?.constraints['users_username_check'],
        ).toEqual({
          type: 'CHECK',
          name: 'users_username_check',
          detail: 'CHAR_LENGTH(username) >= 3',
        })
      })

      // Add multi-schema tests for each database type
      it(`multiple ${config.name} schemas`, async () => {
        const schemaFunction = dbType === 'mysql' ? 'mysqlSchema' : 'pgSchema'

        const schema = `
        import { ${config.functions.table}, ${config.types.id}, varchar, ${config.types.integer}, ${schemaFunction} } from '${config.imports.core}';

        // Define schemas
        export const authSchema = ${schemaFunction}('auth');
        export const publicSchema = ${schemaFunction}('public');

        // Auth schema table
        export const authUsers = authSchema.table('users', {
          id: ${config.types.idColumn()},
          email: varchar('email', { length: 255 }).notNull(),
        });

        // Public schema tables with foreign keys
        export const publicPosts = publicSchema.table('posts', {
          id: ${config.types.idColumn()},
          userId: ${config.types.integer}('user_id').references(() => authUsers.id),
          title: varchar('title', { length: 255 }),
        });

        export const publicComments = publicSchema.table('comments', {
          id: ${config.types.idColumn()},
          postId: ${config.types.integer}('post_id').references(() => publicPosts.id),
          userId: ${config.types.integer}('user_id').references(() => authUsers.id),
        });
      `

        const { value } = await config.processor(schema)

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
          (c: Constraint) => c.type === 'FOREIGN KEY',
        ).length
        expect(foreignKeyCount).toBe(2)
      })

      it('table-level unique constraints', async () => {
        const schema = `
          import { ${config.functions.table}, ${config.types.id}, varchar, unique } from '${config.imports.core}';

          export const users = ${config.functions.table}('users', {
            id: ${config.types.idColumn()},
            firstName: varchar('first_name', { length: 255 }),
            lastName: varchar('last_name', { length: 255 }),
            email: varchar('email', { length: 255 }),
          }, (table) => ({
            fullNameUnique: unique('users_full_name_unique').on(table.firstName, table.lastName),
            emailUnique: unique('users_email_unique').on(table.email),
          }));
        `

        const { value } = await config.processor(schema)

        expect(value.tables['users']?.constraints).toHaveProperty(
          'users_full_name_unique',
        )
        expect(
          value.tables['users']?.constraints['users_full_name_unique'],
        ).toEqual({
          type: 'UNIQUE',
          name: 'users_full_name_unique',
          columnNames: ['first_name', 'last_name'],
        })

        expect(value.tables['users']?.constraints).toHaveProperty(
          'users_email_unique',
        )
        expect(
          value.tables['users']?.constraints['users_email_unique'],
        ).toEqual({
          type: 'UNIQUE',
          name: 'users_email_unique',
          columnNames: ['email'],
        })
      })
    })
  },
)
