import { describe, expect, it } from 'vitest'
import type { Table } from '../../schema/index.js'
import {
  aColumn,
  aDBStructure,
  aRelationship,
  aTable,
  anIndex,
} from '../../schema/index.js'
import { createParserTestCases } from '../__tests__/index.js'
import { processor as _processor } from './index.js'

describe(_processor, () => {
  const userTable = (override?: Partial<Table>) =>
    aDBStructure({
      tables: {
        users: aTable({
          name: 'users',
          columns: {
            id: aColumn({
              name: 'id',
              type: 'bigserial',
              default: 'autoincrement()',
              notNull: true,
              primary: true,
              unique: true,
            }),
            ...override?.columns,
          },
          indexes: {
            users_pkey: anIndex({
              name: 'users_pkey',
              unique: true,
              columns: ['id'],
            }),
            ...override?.indexes,
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
            unique: true,
          }),
        },
        indexes: {
          users_pkey: anIndex({
            name: 'users_pkey',
            unique: true,
            columns: ['id'],
          }),
          users_id_mention_key: anIndex({
            name: 'users_id_mention_key',
            unique: true,
            columns: ['id', 'mention'],
          }),
          users_mention_key: anIndex({
            name: 'users_mention_key',
            unique: true,
            columns: ['mention'],
          }),
        },
      })

      expect(value).toEqual(expected)
    })

    it('relationship (one-to-many)', async () => {
      const keyName = 'postsTousers'
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

      expect(value.relationships).toEqual(
        parserTestCases['foreign key (one-to-many)'](keyName),
      )
    })

    it('relationship (one-to-one)', async () => {
      const keyName = 'postsTousers'
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

      expect(value.relationships).toEqual(
        parserTestCases['foreign key (one-to-one)'](keyName),
      )
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

          const expected = {
            postsTousers: {
              name: 'postsTousers',
              primaryTableName: 'users',
              primaryColumnName: 'id',
              foreignTableName: 'posts',
              foreignColumnName: 'user_id',
              cardinality: 'ONE_TO_MANY',
              updateConstraint: 'NO_ACTION',
              deleteConstraint: expectedAction,
            },
          }

          expect(value.relationships).toEqual(expected)
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

      const usersTable = value.tables['users']
      const postsTable = value.tables['posts']

      if (!usersTable || !usersTable.columns) {
        throw new Error('Users table or columns are undefined')
      }
      if (!postsTable || !postsTable.columns) {
        throw new Error('Posts table or columns are undefined')
      }

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
            unique: true,
          }),
        },
        indexes: {
          users_email_key: anIndex({
            name: 'users_email_key',
            unique: true,
            columns: ['email'],
          }),
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
            unique: false,
          }),
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

      const expectedTables = aDBStructure({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              _id: aColumn({
                name: '_id',
                type: 'bigserial',
                default: 'autoincrement()',
                notNull: true,
                primary: true,
                unique: true,
              }),
              raw_email_address: aColumn({
                name: 'raw_email_address',
                type: 'text',
                notNull: true,
                unique: true,
              }),
            },
            indexes: {
              users_pkey: anIndex({
                name: 'users_pkey',
                columns: ['_id'],
                unique: true,
              }),
              users_raw_email_address_key: {
                name: 'users_raw_email_address_key',
                columns: ['raw_email_address'],
                unique: true,
                type: '',
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
                primary: true,
                unique: true,
              }),
              raw_user_id: aColumn({
                name: 'raw_user_id',
                type: 'bigint',
                notNull: true,
                unique: false,
              }),
            },
            indexes: {
              posts_pkey: anIndex({
                name: 'posts_pkey',
                unique: true,
                columns: ['id'],
              }),
            },
          }),
        },
      })
      expectedTables['relationships'] = {
        postsTousers: aRelationship({
          name: 'postsTousers',
          foreignColumnName: 'raw_user_id',
          foreignTableName: 'posts',
          primaryColumnName: '_id',
          primaryTableName: 'users',
        }),
      }

      expect(value).toEqual(expectedTables)
    })

    it('relationship (implicit many-to-many)', async () => {
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

      const expectedDBStructure = aDBStructure({
        tables: {
          Post: aTable({
            name: 'Post',
            columns: {
              id: aColumn({
                name: 'id',
                type: 'serial',
                default: 'autoincrement()',
                notNull: true,
                primary: true,
                unique: true,
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
          }),
          Category: aTable({
            name: 'Category',
            columns: {
              id: aColumn({
                name: 'id',
                type: 'serial',
                default: 'autoincrement()',
                notNull: true,
                primary: true,
                unique: true,
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
          }),
        },
        relationships: {
          _CategoryToPost_A_fkey: aRelationship({
            name: '_CategoryToPost_A_fkey',
            primaryTableName: 'Category',
            primaryColumnName: 'id',
            foreignTableName: '_CategoryToPost',
            foreignColumnName: 'A',
            cardinality: 'ONE_TO_MANY',
            updateConstraint: 'CASCADE',
            deleteConstraint: 'CASCADE',
          }),
          _CategoryToPost_B_fkey: aRelationship({
            name: '_CategoryToPost_B_fkey',
            primaryTableName: 'Post',
            primaryColumnName: 'id',
            foreignTableName: '_CategoryToPost',
            foreignColumnName: 'B',
            cardinality: 'ONE_TO_MANY',
            updateConstraint: 'CASCADE',
            deleteConstraint: 'CASCADE',
          }),
        },
      })

      expect(value).toEqual(expectedDBStructure)
    })
  })
})
