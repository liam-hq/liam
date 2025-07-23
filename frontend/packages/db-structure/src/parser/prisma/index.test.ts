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
              type: 'bigserial',
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
                default: 'autoincrement()',
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
                default: 'autoincrement()',
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
                default: 'autoincrement()',
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
                default: 'autoincrement()',
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
                default: 'autoincrement()',
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
                default: 'autoincrement()',
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
  })
})
