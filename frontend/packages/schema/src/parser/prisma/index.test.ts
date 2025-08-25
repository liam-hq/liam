import { describe, expect, it } from 'vitest'
import type { Table } from '../../schema/index.js'
import {
  aColumn,
  anEnum,
  anIndex,
  aSchema,
  aTable,
} from '../../schema/index.js'
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
              type: 'bigserial',
              default: null, // autoincrement() handled by type system
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

  const prismaSchemaHeader = `
    generator client {
      provider = "prisma-client-js"
    }

    datasource db {
      provider = "postgresql"
      url = env("DATABASE_URL")
    }
  `
  const processor = async (schema: string) =>
    _processor(`${prismaSchemaHeader}\n\n${schema}`)

  const parserTestCases = createParserTestCases(userTable)

  describe('should parse prisma schema correctly', () => {
    it('not null', async () => {
      const { value } = await processor(`
        model users {
          id   BigInt    @id @default(autoincrement())
          name String
        }
      `)

      const expected = userTable({
        columns: {
          name: aColumn({
            name: 'name',
            type: 'text',
            notNull: true,
          }),
        },
      })

      expect(value).toEqual(expected)
    })

    it('nullable', async () => {
      const { value } = await processor(`
        model users {
          id   BigInt    @id @default(autoincrement())
          description String?
        }
      `)

      expect(value).toEqual(parserTestCases.nullable)
    })

    it('default value as string', async () => {
      const { value } = await processor(`
        model users {
          id   BigInt    @id @default(autoincrement())
          description String? @default("user's description")
        }
      `)

      expect(value).toEqual(parserTestCases['default value as string'])
    })

    it('default value as integer', async () => {
      const { value } = await processor(`
        model users {
          id   BigInt    @id @default(autoincrement())
          age  Int    @default(30)
        }
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
      const { value } = await processor(`
        model users {
          id     BigInt     @id @default(autoincrement())
          active Boolean @default(true)
        }
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
      const { value } = await processor(`
        model users {
          id   BigInt    @id @default(autoincrement())
          /// this is description
          description String?
        }
      `)

      expect(value).toEqual(parserTestCases['column comment'])
    })

    it('table comment', async () => {
      const { value } = await processor(`
        /// store our users.
        model users {
          id   BigInt    @id @default(autoincrement())
        }
      `)

      expect(value).toEqual(parserTestCases['table comment'])
    })

    it('index (unique: false)', async () => {
      const indexName = 'users_id_email_idx'
      const { value } = await processor(`
        model users {
          id   BigInt    @id @default(autoincrement())
          email String? @db.VarChar
          @@index([id, email])
        }
      `)
      expect(value).toEqual(
        parserTestCases['index (unique: false)'](indexName, ''),
      )
    })

    it('index (unique: true)', async () => {
      const { value } = await processor(`
        model users {
          id   BigInt    @id @default(autoincrement())
          mention String? @unique
          @@unique([id, mention])
        }
      `)

      const expected = userTable({
        columns: {
          mention: aColumn({
            name: 'mention',
            type: 'text',
            notNull: false,
          }),
        },
        indexes: {
          users_pkey: anIndex({
            name: 'users_pkey',
            columns: ['id'],
            unique: true,
          }),
          users_id_mention_key: anIndex({
            name: 'users_id_mention_key',
            columns: ['id', 'mention'],
            unique: true,
          }),
          users_mention_key: anIndex({
            name: 'users_mention_key',
            columns: ['mention'],
            unique: true,
          }),
        },
        constraints: {
          UNIQUE_mention: {
            type: 'UNIQUE',
            name: 'UNIQUE_mention',
            columnNames: ['mention'],
          },
        },
      })

      expect(value).toEqual(expected)
    })

    it('foreign key constraint (one-to-many)', async () => {
      const { value } = await processor(`
        model users {
          id   BigInt    @id @default(autoincrement())
          posts posts[]
        }

        model posts {
          id   BigInt    @id @default(autoincrement())
          user users @relation(fields: [user_id], references: [id])
          user_id BigInt
        }
      `)

      expect(value.tables['posts']?.constraints['postsTousers']).toEqual({
        type: 'FOREIGN KEY',
        name: 'postsTousers',
        columnNames: ['user_id'],
        targetTableName: 'users',
        targetColumnNames: ['id'],
        updateConstraint: 'NO_ACTION',
        deleteConstraint: 'NO_ACTION',
      })
    })

    it('foreign key constraint (one-to-one)', async () => {
      const { value } = await processor(`
        model users {
          id   BigInt    @id @default(autoincrement())
          post posts?
        }

        model posts {
          id      BigInt    @id @default(autoincrement())
          user    users  @relation(fields: [user_id], references: [id])
          user_id BigInt    @unique
        }
      `)

      expect(value.tables['posts']?.constraints['postsTousers']).toEqual({
        type: 'FOREIGN KEY',
        name: 'postsTousers',
        columnNames: ['user_id'],
        targetTableName: 'users',
        targetColumnNames: ['id'],
        updateConstraint: 'NO_ACTION',
        deleteConstraint: 'NO_ACTION',
      })
    })

    describe('foreign key constraints (on delete)', () => {
      const constraintCases = [
        ['Cascade', 'CASCADE'],
        ['Restrict', 'RESTRICT'],
        ['NoAction', 'NO_ACTION'],
        ['SetNull', 'SET_NULL'],
        ['SetDefault', 'SET_DEFAULT'],
      ] as const

      it.each(constraintCases)(
        'on delete %s',
        async (prismaAction: string, expectedAction: string) => {
          const { value } = await processor(`
          model users {
            id   BigInt    @id @default(autoincrement())
            posts posts[]
          }

          model posts {
            id   BigInt    @id @default(autoincrement())
            user users @relation(fields: [user_id], references: [id], onDelete: ${prismaAction})
            user_id BigInt
          }
        `)

          expect(value.tables['posts']?.constraints['postsTousers']).toEqual({
            type: 'FOREIGN KEY',
            name: 'postsTousers',
            columnNames: ['user_id'],
            targetTableName: 'users',
            targetColumnNames: ['id'],
            updateConstraint: 'NO_ACTION',
            deleteConstraint: expectedAction,
          })
        },
      )
    })

    it('columns do not include model type', async () => {
      const { value } = await processor(`
        model users {
          id   BigInt    @id @default(autoincrement())
          posts posts[]
        }
        model posts {
          id   BigInt    @id @default(autoincrement())
          user users @relation(fields: [user_id], references: [id])
          user_id BigInt
        }
      `)

      expect(value.tables['users']).toBeDefined()
      expect(value.tables['posts']).toBeDefined()

      const usersTable = value.tables['users']
      const postsTable = value.tables['posts']

      if (!usersTable || !postsTable) {
        expect(usersTable).toBeDefined()
        expect(postsTable).toBeDefined()
        return
      }

      expect(usersTable.columns).toBeDefined()
      expect(postsTable.columns).toBeDefined()

      const usersColumnNames = Object.keys(usersTable.columns)
      const postsColumnNames = Object.keys(postsTable.columns)

      expect(usersColumnNames).toEqual(['id'])
      expect(usersColumnNames).not.toContain('posts')
      expect(postsColumnNames).toEqual(['id', 'user_id'])
      expect(postsColumnNames).not.toContain('user')
    })

    it('unique', async () => {
      const { value } = await processor(`
        model users {
          id   BigInt    @id @default(autoincrement())
          email String @unique
        }
      `)

      const expected = userTable({
        columns: {
          email: aColumn({
            name: 'email',
            type: 'text',
            notNull: true,
          }),
        },
        indexes: {
          users_email_key: anIndex({
            name: 'users_email_key',
            columns: ['email'],
            unique: true,
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

    it('not unique', async () => {
      const { value } = await processor(`
        model users {
          id   BigInt    @id @default(autoincrement())
          email String
        }
      `)

      const expected = userTable({
        columns: {
          email: aColumn({
            name: 'email',
            type: 'text',
            notNull: true,
          }),
        },
        constraints: {
          PRIMARY_id: {
            type: 'PRIMARY KEY',
            columnNames: ['id'],
            name: 'PRIMARY_id',
          },
        },
      })

      expect(value).toEqual(expected)
    })

    it('@map', async () => {
      const { value } = await processor(`
        model users {
          id   BigInt    @id @default(autoincrement()) @map("_id")
          posts posts[]
          email String   @map("raw_email_address")
          @@unique([email])
        }

        model posts {
          id   BigInt    @id @default(autoincrement())
          user users     @relation(fields: [user_id], references: [id])
          user_id BigInt @map("raw_user_id")
        }
      `)

      const expectedTables = aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              _id: aColumn({
                name: '_id',
                type: 'bigserial',
                default: null, // autoincrement() handled by type system
                notNull: true,
              }),
              raw_email_address: aColumn({
                name: 'raw_email_address',
                type: 'text',
                notNull: true,
              }),
            },
            indexes: {
              users_pkey: anIndex({
                name: 'users_pkey',
                columns: ['_id'],
                unique: true,
              }),
              users_raw_email_address_key: anIndex({
                name: 'users_raw_email_address_key',
                columns: ['raw_email_address'],
                unique: true,
              }),
            },
            constraints: {
              PRIMARY__id: {
                type: 'PRIMARY KEY',
                name: 'PRIMARY__id',
                columnNames: ['_id'],
              },
              UNIQUE_raw_email_address: {
                type: 'UNIQUE',
                name: 'UNIQUE_raw_email_address',
                columnNames: ['raw_email_address'],
              },
            },
          }),
          posts: aTable({
            name: 'posts',
            columns: {
              id: aColumn({
                name: 'id',
                type: 'bigserial',
                default: null, // autoincrement() handled by type system
                notNull: true,
              }),
              raw_user_id: aColumn({
                name: 'raw_user_id',
                type: 'bigint',
                notNull: true,
              }),
            },
            indexes: {
              posts_pkey: anIndex({
                name: 'posts_pkey',
                columns: ['id'],
                unique: true,
              }),
            },
            constraints: {
              PRIMARY_id: {
                type: 'PRIMARY KEY',
                name: 'PRIMARY_id',
                columnNames: ['id'],
              },
              postsTousers: {
                type: 'FOREIGN KEY',
                name: 'postsTousers',
                columnNames: ['raw_user_id'],
                targetTableName: 'users',
                targetColumnNames: ['_id'],
                updateConstraint: 'NO_ACTION',
                deleteConstraint: 'NO_ACTION',
              },
            },
          }),
        },
      })
      expect(value).toEqual(expectedTables)
    })

    it('@@map', async () => {
      const { value } = await processor(`
        model User {
          id    Int     @id @default(autoincrement()) @map("_id")
          posts Post[]
          email String  @unique @map("raw_email_address")
          role  Role    @default(USER)

          @@map("users")
        }

        model Post {
          id     Int   @id @default(autoincrement())
          user   User  @relation(fields: [user_id], references: [id])
          user_id Int   @map("raw_user_id")

          @@map("posts")
        }

        enum Role {
          USER
          ADMIN
        }
      `)

      const expectedTables = aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              _id: aColumn({
                name: '_id',
                type: 'serial',
                default: null, // autoincrement() handled by type system
                notNull: true,
              }),
              raw_email_address: aColumn({
                name: 'raw_email_address',
                type: 'text',
                notNull: true,
              }),
              role: aColumn({
                name: 'role',
                type: 'Role',
                notNull: true,
                default: 'USER',
              }),
            },
            indexes: {
              users_pkey: anIndex({
                name: 'users_pkey',
                columns: ['_id'],
                unique: true,
              }),
              users_raw_email_address_key: anIndex({
                name: 'users_raw_email_address_key',
                columns: ['raw_email_address'],
                unique: true,
              }),
            },
            constraints: {
              PRIMARY__id: {
                type: 'PRIMARY KEY',
                name: 'PRIMARY__id',
                columnNames: ['_id'],
              },
              UNIQUE_raw_email_address: {
                type: 'UNIQUE',
                name: 'UNIQUE_raw_email_address',
                columnNames: ['raw_email_address'],
              },
            },
          }),
          posts: aTable({
            name: 'posts',
            columns: {
              id: aColumn({
                name: 'id',
                type: 'serial',
                default: null, // autoincrement() handled by type system
                notNull: true,
              }),
              raw_user_id: aColumn({
                name: 'raw_user_id',
                type: 'integer',
                notNull: true,
              }),
            },
            indexes: {
              posts_pkey: anIndex({
                name: 'posts_pkey',
                columns: ['id'],
                unique: true,
              }),
            },
            constraints: {
              PRIMARY_id: {
                type: 'PRIMARY KEY',
                name: 'PRIMARY_id',
                columnNames: ['id'],
              },
              PostToUser: {
                type: 'FOREIGN KEY',
                name: 'PostToUser',
                columnNames: ['raw_user_id'],
                targetTableName: 'users',
                targetColumnNames: ['_id'],
                updateConstraint: 'NO_ACTION',
                deleteConstraint: 'NO_ACTION',
              },
            },
          }),
        },
        enums: {
          Role: anEnum({
            name: 'Role',
            values: ['USER', 'ADMIN'],
            comment: null,
          }),
        },
      })

      expect(value).toEqual(expectedTables)
    })

    it('implicit many-to-many relationship with join table', async () => {
      const { value } = await processor(`
        model Post {
          id         Int        @id @default(autoincrement())
          title      String
          categories Category[]
        }
        model Category {
          id    Int    @id @default(autoincrement())
          name  String
          posts Post[]
        }
      `)

      const expectedSchema = aSchema({
        tables: {
          Post: aTable({
            name: 'Post',
            columns: {
              id: aColumn({
                name: 'id',
                type: 'serial',
                default: null, // autoincrement() handled by type system
                notNull: true,
              }),
              title: aColumn({
                name: 'title',
                type: 'text',
                notNull: true,
              }),
            },
            indexes: {
              Post_pkey: anIndex({
                name: 'Post_pkey',
                columns: ['id'],
                unique: true,
              }),
            },
            constraints: {
              PRIMARY_id: {
                type: 'PRIMARY KEY',
                name: 'PRIMARY_id',
                columnNames: ['id'],
              },
            },
          }),
          Category: aTable({
            name: 'Category',
            columns: {
              id: aColumn({
                name: 'id',
                type: 'serial',
                default: null, // autoincrement() handled by type system
                notNull: true,
              }),
              name: aColumn({
                name: 'name',
                type: 'text',
                notNull: true,
              }),
            },
            indexes: {
              Category_pkey: anIndex({
                name: 'Category_pkey',
                columns: ['id'],
                unique: true,
              }),
            },
            constraints: {
              PRIMARY_id: {
                type: 'PRIMARY KEY',
                name: 'PRIMARY_id',
                columnNames: ['id'],
              },
            },
          }),
          _CategoryToPost: aTable({
            name: '_CategoryToPost',
            columns: {
              A: aColumn({
                name: 'A',
                type: 'integer',
                notNull: true,
              }),
              B: aColumn({
                name: 'B',
                type: 'integer',
                notNull: true,
              }),
            },
            indexes: {
              _CategoryToPost_AB_pkey: anIndex({
                name: '_CategoryToPost_AB_pkey',
                columns: ['A', 'B'],
                unique: true,
              }),
              _CategoryToPost_B_index: anIndex({
                name: '_CategoryToPost_B_index',
                columns: ['B'],
                unique: false,
              }),
            },
            constraints: {
              _CategoryToPost_A_fkey: {
                type: 'FOREIGN KEY',
                name: '_CategoryToPost_A_fkey',
                columnNames: ['A'],
                targetTableName: 'Category',
                targetColumnNames: ['id'],
                updateConstraint: 'CASCADE',
                deleteConstraint: 'CASCADE',
              },
              _CategoryToPost_B_fkey: {
                type: 'FOREIGN KEY',
                name: '_CategoryToPost_B_fkey',
                columnNames: ['B'],
                targetTableName: 'Post',
                targetColumnNames: ['id'],
                updateConstraint: 'CASCADE',
                deleteConstraint: 'CASCADE',
              },
            },
          }),
        },
      })

      expect(value).toEqual(expectedSchema)
    })

    it('should parse all supported Prisma default functions', async () => {
      const { value } = await processor(`
        model User {
          id           BigInt   @id @default(autoincrement())
          cuid_id      String   @default(cuid())
          cuid2_id     String   @default(cuid(2))
          uuid_id      String   @default(uuid())
          uuid4_id     String   @default(uuid(4))
          uuid7_id     String   @default(uuid(7))
          ulid_id      String   @default(ulid())
          nanoid_id    String   @default(nanoid())
          nanoid_10    String   @default(nanoid(10))
          created_at   DateTime @default(now())
          custom_field String   @default(dbgenerated("'custom_value'"))
        }
      `)

      const expectedSchema = aSchema({
        tables: {
          User: aTable({
            name: 'User',
            columns: {
              // autoincrement() -> SERIAL type, null default (handled by type system)
              id: aColumn({
                name: 'id',
                type: 'bigserial',
                default: null,
                notNull: true,
              }),
              // cuid() -> TEXT type, null default (Prisma Client generated)
              cuid_id: aColumn({
                name: 'cuid_id',
                type: 'text',
                default: null,
                notNull: true,
              }),
              // cuid(2) -> TEXT type, null default (Prisma Client generated)
              cuid2_id: aColumn({
                name: 'cuid2_id',
                type: 'text',
                default: null,
                notNull: true,
              }),
              // uuid() -> TEXT type, null default (Prisma Client generated)
              uuid_id: aColumn({
                name: 'uuid_id',
                type: 'text',
                default: null,
                notNull: true,
              }),
              // uuid(4) -> TEXT type, null default (Prisma Client generated)
              uuid4_id: aColumn({
                name: 'uuid4_id',
                type: 'text',
                default: null,
                notNull: true,
              }),
              // uuid(7) -> TEXT type, null default (Prisma Client generated)
              uuid7_id: aColumn({
                name: 'uuid7_id',
                type: 'text',
                default: null,
                notNull: true,
              }),
              // ulid() -> TEXT type, null default (Prisma Client generated)
              ulid_id: aColumn({
                name: 'ulid_id',
                type: 'text',
                default: null,
                notNull: true,
              }),
              // nanoid() -> TEXT type, null default (Prisma Client generated)
              nanoid_id: aColumn({
                name: 'nanoid_id',
                type: 'text',
                default: null,
                notNull: true,
              }),
              // nanoid(10) -> TEXT type, null default (Prisma Client generated)
              nanoid_10: aColumn({
                name: 'nanoid_10',
                type: 'text',
                default: null,
                notNull: true,
              }),
              // now() -> TIMESTAMP(3) type, CURRENT_TIMESTAMP default (DB generated)
              created_at: aColumn({
                name: 'created_at',
                type: 'timestamp(3)',
                default: 'CURRENT_TIMESTAMP',
                notNull: true,
              }),
              // dbgenerated() -> custom SQL expression (DB generated)
              custom_field: aColumn({
                name: 'custom_field',
                type: 'text',
                default: "'custom_value'",
                notNull: true,
              }),
            },
            indexes: {
              User_pkey: anIndex({
                name: 'User_pkey',
                columns: ['id'],
                unique: true,
              }),
            },
            constraints: {
              PRIMARY_id: {
                type: 'PRIMARY KEY',
                name: 'PRIMARY_id',
                columnNames: ['id'],
              },
            },
            comment: null,
          }),
        },
      })

      expect(value).toEqual(expectedSchema)
    })

    it('unsupported functions cause Prisma DMMF errors (expected behavior)', async () => {
      // Test that sequence() causes Prisma to reject the schema
      await expect(
        processor(`
          model Test {
            id String @id @default(sequence())
          }
        `),
      ).rejects.toThrow()

      // Test that auto() causes Prisma to reject the schema
      await expect(
        processor(`
          model Test {
            id String @id @default(auto())
          }
        `),
      ).rejects.toThrow()
    })

    it('sequence() works with CockroachDB provider but our parser converts it', async () => {
      // Test with CockroachDB provider where sequence() is supported
      const cockroachProcessor = async (schema: string) =>
        _processor(`

          generator client {
            provider = "prisma-client-js"
          }

          datasource db {
            provider = "cockroachdb"
            url = env("DATABASE_URL")
          }

          ${schema}
        `)

      const { value } = await cockroachProcessor(`
        model Test {
          id String @id @default(sequence())
        }
      `)

      // Our parser should handle sequence() gracefully by returning null default
      expect(value.tables['Test']?.columns['id']?.type).toBe('text')
      expect(value.tables['Test']?.columns['id']?.default).toBe(null)
    })

    it('auto() works with MongoDB provider but our parser converts it', async () => {
      // Test with MongoDB provider where auto() is supported
      const mongoProcessor = async (schema: string) =>
        _processor(`
          generator client {
            provider = "prisma-client-js"
          }

          datasource db {
            provider = "mongodb"
            url = env("DATABASE_URL")
          }

          ${schema}
        `)

      const { value } = await mongoProcessor(`
        model Test {
          id String @id @default(auto()) @map("_id") @db.ObjectId
        }
      `)

      // Our parser should handle auto() gracefully by returning null default
      // MongoDB ObjectId native type converts to 'objectid', not 'text'
      expect(value.tables['Test']?.columns['_id']?.type).toBe('objectid')
      expect(value.tables['Test']?.columns['_id']?.default).toBe(null)
    })

    it('should correctly map @db.SmallInt with autoincrement() to smallserial', async () => {
      const { value } = await processor(`
        model Test {
          id Int @id @default(autoincrement()) @db.SmallInt
        }
      `)

      // Should map to smallserial, not serial
      expect(value.tables['Test']?.columns['id']?.type).toBe('smallserial')
      expect(value.tables['Test']?.columns['id']?.default).toBe(null)
    })

    it('should preserve explicit native types even with text-generating functions', async () => {
      const { value } = await processor(`
        model Test {
          id         Int    @id @default(autoincrement())
          uuid_field String @default(uuid()) @db.Uuid
          cuid_field String @default(cuid()) @db.VarChar(30)
        }
      `)

      // Should preserve @db.Uuid instead of forcing text
      expect(value.tables['Test']?.columns['uuid_field']?.type).toBe('uuid')
      expect(value.tables['Test']?.columns['uuid_field']?.default).toBe(null)

      // Should preserve @db.VarChar(30) instead of forcing text
      expect(value.tables['Test']?.columns['cuid_field']?.type).toBe(
        'varchar(30)',
      )
      expect(value.tables['Test']?.columns['cuid_field']?.default).toBe(null)
    })
  })

  describe('enum types', () => {
    it('should parse basic enum type', async () => {
      const { value } = await processor(`
        enum Role {
          USER
          ADMIN
          MODERATOR
        }

        model User {
          id   Int  @id @default(autoincrement())
          role Role
        }
      `)

      expect(value.enums).toEqual({
        Role: {
          name: 'Role',
          values: ['USER', 'ADMIN', 'MODERATOR'],
          comment: null,
        },
      })
    })

    it('should parse enum with comment', async () => {
      const { value } = await processor(`
        /// User Role enumeration
        enum UserStatus {
          ACTIVE
          INACTIVE
          PENDING
        }

        model User {
          id     Int        @id @default(autoincrement())
          status UserStatus
        }
      `)

      expect(value.enums).toEqual({
        UserStatus: {
          name: 'UserStatus',
          values: ['ACTIVE', 'INACTIVE', 'PENDING'],
          comment: 'User Role enumeration',
        },
      })
    })

    it('should parse multiple enum types', async () => {
      const { value } = await processor(`
        /// Task Priority levels
        enum Priority {
          LOW
          MEDIUM
          HIGH
          URGENT
        }

        enum Category {
          BUG
          FEATURE
          IMPROVEMENT
        }

        model Task {
          id       Int      @id @default(autoincrement())
          priority Priority
          category Category
        }
      `)

      expect(value.enums).toEqual({
        Priority: {
          name: 'Priority',
          values: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
          comment: 'Task Priority levels',
        },
        Category: {
          name: 'Category',
          values: ['BUG', 'FEATURE', 'IMPROVEMENT'],
          comment: null,
        },
      })
    })

    it('should handle schema with no enums', async () => {
      const { value } = await processor(`
        model User {
          id   Int    @id @default(autoincrement())
          name String
        }
      `)

      expect(value.enums).toEqual({})
    })

    it('should parse enum used as default value', async () => {
      const { value } = await processor(`
        enum Role {
          USER
          ADMIN
        }

        model User {
          id   Int  @id @default(autoincrement())
          role Role @default(USER)
        }
      `)

      expect(value.enums).toEqual({
        Role: {
          name: 'Role',
          values: ['USER', 'ADMIN'],
          comment: null,
        },
      })

      // Also verify the column has the correct enum type and default
      const userTable = value.tables['User']
      expect(userTable?.columns['role']).toMatchObject({
        name: 'role',
        type: 'Role',
        default: 'USER',
        notNull: true,
      })
    })

    it('should parse enum values with @map directives', async () => {
      const { value } = await processor(`
        enum Status {
          ACTIVE    @map("active")
          INACTIVE  @map("inactive") 
          PENDING   @map("pending")
          DELETED   @map("deleted")
        }

        model User {
          id     Int    @id @default(autoincrement())
          status Status @default(ACTIVE)
        }
      `)

      // Enum should use the mapped database values
      expect(value.enums).toEqual({
        Status: {
          name: 'Status',
          values: ['active', 'inactive', 'pending', 'deleted'], // mapped values
          comment: null,
        },
      })

      // Column should still reference the original enum type name
      const userTable = value.tables['User']
      expect(userTable?.columns['status']).toMatchObject({
        name: 'status',
        type: 'Status', // original enum name
        default: 'ACTIVE', // original value name in default
        notNull: true,
      })
    })
  })
})
