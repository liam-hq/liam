import { describe, expect, it } from 'vitest'
import type { Table } from '../../schema/index.js'
import { aColumn, anIndex, aSchema, aTable } from '../../schema/index.js'
import { processor } from './index.js'

describe(processor, () => {
  const userTable = (override?: Partial<Table>) =>
    aSchema({
      tables: {
        users: aTable({
          name: 'users',
          columns: {
            id: aColumn({
              name: 'id',
              type: 'int',
              notNull: true,
            }),
            ...override?.columns,
          },
          indexes: override?.indexes ?? {},
          constraints: override?.constraints ?? {},
        }),
      },
    })

  describe('should parse tbls schema correctly', () => {
    it('not null', async () => {
      const { value } = await processor(
        JSON.stringify({
          name: 'testdb',
          tables: [
            {
              name: 'users',
              type: 'TABLE',
              columns: [
                {
                  name: 'id',
                  type: 'int',
                  nullable: false,
                },
              ],
            },
          ],
        }),
      )

      const expected = userTable()

      expect(value).toEqual(expected)
    })

    it('nullable', async () => {
      const { value } = await processor(
        JSON.stringify({
          name: 'testdb',
          tables: [
            {
              name: 'users',
              type: 'TABLE',
              columns: [
                {
                  name: 'id',
                  type: 'int',
                  nullable: true,
                },
              ],
            },
          ],
        }),
      )

      const expected = userTable({
        columns: {
          id: aColumn({
            name: 'id',
            type: 'int',
            notNull: false,
          }),
        },
      })

      expect(value).toEqual(expected)
    })

    it('not unique', async () => {
      const { value } = await processor(
        JSON.stringify({
          name: 'testdb',
          tables: [
            {
              name: 'users',
              type: 'TABLE',
              columns: [
                {
                  name: 'id',
                  type: 'int',
                  nullable: false,
                },
                {
                  name: 'email',
                  type: 'text',
                  nullable: true,
                },
              ],
            },
          ],
        }),
      )

      const expected = userTable({
        columns: {
          email: aColumn({
            name: 'email',
            type: 'text',
          }),
        },
      })

      expect(value).toEqual(expected)
    })

    it('unique', async () => {
      const { value } = await processor(
        JSON.stringify({
          name: 'testdb',
          tables: [
            {
              name: 'users',
              type: 'TABLE',
              columns: [
                {
                  name: 'id',
                  type: 'int',
                  nullable: false,
                },
                {
                  name: 'email',
                  type: 'text',
                  nullable: true,
                },
              ],
              constraints: [
                {
                  name: 'users_email_key',
                  type: 'UNIQUE',
                  def: 'UNIQUE KEY users_email_key (email)',
                  table: 'users',
                  columns: ['email'],
                },
              ],
            },
          ],
        }),
      )

      const expected = userTable({
        columns: {
          email: aColumn({
            name: 'email',
            type: 'text',
          }),
        },
        constraints: {
          users_email_key: {
            type: 'UNIQUE',
            name: 'users_email_key',
            columnNames: ['email'],
          },
        },
      })

      expect(value).toEqual(expected)
    })

    it('index (unique: false)', async () => {
      const { value } = await processor(
        JSON.stringify({
          name: 'testdb',
          tables: [
            {
              name: 'users',
              type: 'TABLE',
              columns: [
                {
                  name: 'id',
                  type: 'int',
                  nullable: false,
                },
                {
                  name: 'email',
                  type: 'text',
                  nullable: true,
                },
              ],
              indexes: [
                {
                  name: 'users_email_idx',
                  def: 'CREATE INDEX users_email_idx ON users USING btree (email)',
                  table: 'users',
                  columns: ['email'],
                },
              ],
            },
          ],
        }),
      )

      const expected = userTable({
        columns: {
          email: aColumn({
            name: 'email',
            type: 'text',
          }),
        },
        indexes: {
          users_email_idx: anIndex({
            name: 'users_email_idx',
            columns: ['email'],
            type: 'btree',
          }),
        },
      })

      expect(value).toEqual(expected)
    })

    it('index (unique: true)', async () => {
      const { value } = await processor(
        JSON.stringify({
          name: 'testdb',
          tables: [
            {
              name: 'users',
              type: 'TABLE',
              columns: [
                {
                  name: 'id',
                  type: 'int',
                  nullable: false,
                },
                {
                  name: 'email',
                  type: 'text',
                  nullable: true,
                },
              ],
              indexes: [
                {
                  name: 'users_email_key',
                  def: 'CREATE UNIQUE INDEX users_email_key ON users USING btree (email)',
                  table: 'users',
                  columns: ['email'],
                },
              ],
            },
          ],
        }),
      )

      const expected = userTable({
        columns: {
          email: aColumn({
            name: 'email',
            type: 'text',
            notNull: false,
          }),
        },
        indexes: {
          users_email_key: anIndex({
            name: 'users_email_key',
            type: 'btree',
            columns: ['email'],
            unique: true,
          }),
        },
      })

      expect(value).toEqual(expected)
    })

    it('primary key', async () => {
      const { value } = await processor(
        JSON.stringify({
          name: 'testdb',
          tables: [
            {
              name: 'users',
              type: 'TABLE',
              columns: [
                {
                  name: 'id',
                  type: 'int',
                  nullable: false,
                },
              ],
              constraints: [
                {
                  name: 'users_pkey',
                  type: 'PRIMARY KEY',
                  def: 'PRIMARY KEY (id)',
                  table: 'users',
                  columns: ['id'],
                },
              ],
            },
          ],
        }),
      )

      const expected = userTable({
        columns: {
          id: aColumn({
            name: 'id',
            type: 'int',
            notNull: true,
          }),
        },
        constraints: {
          users_pkey: {
            type: 'PRIMARY KEY',
            name: 'users_pkey',
            columnNames: ['id'],
          },
        },
      })

      expect(value).toEqual(expected)
    })

    it('default value as string', async () => {
      const { value } = await processor(
        JSON.stringify({
          name: 'testdb',
          tables: [
            {
              name: 'users',
              type: 'TABLE',
              columns: [
                {
                  name: 'id',
                  type: 'int',
                  nullable: false,
                  default: "nextval('users_id_seq'::regclass)",
                },
              ],
            },
          ],
        }),
      )

      const expected = userTable({
        columns: {
          id: aColumn({
            name: 'id',
            type: 'int',
            notNull: true,
            default: "nextval('users_id_seq'::regclass)",
          }),
        },
      })

      expect(value).toEqual(expected)
    })

    it('default value as integer', async () => {
      const { value } = await processor(
        JSON.stringify({
          name: 'testdb',
          tables: [
            {
              name: 'users',
              type: 'TABLE',
              columns: [
                {
                  name: 'id',
                  type: 'int',
                  nullable: false,
                },
                {
                  name: 'age',
                  type: 'int',
                  nullable: false,
                  // NOTE: tblsColumn.default is of type string | null | undefined
                  default: '30',
                },
              ],
            },
          ],
        }),
      )

      const expected = userTable({
        columns: {
          id: aColumn({
            name: 'id',
            type: 'int',
            notNull: true,
          }),
          age: aColumn({
            name: 'age',
            type: 'int',
            notNull: true,
            default: 30,
          }),
        },
      })

      expect(value).toEqual(expected)
    })

    it('default value as boolean', async () => {
      const { value } = await processor(
        JSON.stringify({
          name: 'testdb',
          tables: [
            {
              name: 'users',
              type: 'TABLE',
              columns: [
                {
                  name: 'id',
                  type: 'int',
                  nullable: false,
                },
                {
                  name: 'active',
                  type: 'bool',
                  nullable: false,
                  // NOTE: tblsColumn.default is of type string | null | undefined
                  default: 'true',
                },
              ],
            },
          ],
        }),
      )

      const expected = userTable({
        columns: {
          id: aColumn({
            name: 'id',
            type: 'int',
            notNull: true,
          }),
          active: aColumn({
            name: 'active',
            type: 'bool',
            notNull: true,
            default: true,
          }),
        },
      })

      expect(value).toEqual(expected)
    })

    it('table comment', async () => {
      const { value } = await processor(
        JSON.stringify({
          name: 'testdb',
          tables: [
            {
              name: 'users',
              type: 'TABLE',
              columns: [
                {
                  name: 'id',
                  type: 'int',
                  nullable: false,
                },
              ],
              comment: 'store our users.',
            },
          ],
        }),
      )

      const expected = aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({
                name: 'id',
                type: 'int',
                notNull: true,
              }),
            },
            comment: 'store our users.',
          }),
        },
      })

      expect(value).toEqual(expected)
    })

    it('column comment', async () => {
      const { value } = await processor(
        JSON.stringify({
          name: 'testdb',
          tables: [
            {
              name: 'users',
              type: 'TABLE',
              columns: [
                {
                  name: 'id',
                  type: 'int',
                  nullable: false,
                  comment: 'this is description',
                },
              ],
            },
          ],
        }),
      )

      const expected = userTable({
        columns: {
          id: aColumn({
            name: 'id',
            type: 'int',
            notNull: true,
            comment: 'this is description',
          }),
        },
      })

      expect(value).toEqual(expected)
    })

    describe('constraint', () => {
      it('PRIMARY KEY constraint', async () => {
        const { value } = await processor(
          JSON.stringify({
            name: 'testdb',
            tables: [
              {
                name: 'users',
                type: 'TABLE',
                columns: [{ name: 'id', type: 'int', nullable: false }],
                constraints: [
                  {
                    name: 'PRIMARY',
                    type: 'PRIMARY KEY',
                    def: 'PRIMARY KEY (id)',
                    table: 'users',
                    columns: ['id'],
                  },
                ],
              },
            ],
          }),
        )

        const expected = {
          PRIMARY: {
            type: 'PRIMARY KEY',
            name: 'PRIMARY',
            columnNames: ['id'],
          },
        }

        expect(value.tables['users']?.constraints).toEqual(expected)
      })

      it('FOREIGN KEY constraint', async () => {
        const { value } = await processor(
          JSON.stringify({
            name: 'testdb',
            tables: [
              {
                name: 'users',
                type: 'TABLE',
                columns: [{ name: 'id', type: 'int', nullable: false }],
              },
              {
                name: 'posts',
                type: 'TABLE',
                columns: [
                  { name: 'id', type: 'int', nullable: false },
                  { name: 'user_id', type: 'int', nullable: false },
                ],
                constraints: [
                  {
                    type: 'FOREIGN KEY',
                    name: 'post_user_id_fk',
                    def: 'FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE RESTRICT',
                    table: 'posts',
                    referenced_table: 'users',
                    columns: ['user_id'],
                    referenced_columns: ['id'],
                  },
                ],
              },
            ],
          }),
        )

        const expected = {
          post_user_id_fk: {
            type: 'FOREIGN KEY',
            name: 'post_user_id_fk',
            columnNames: ['user_id'],
            targetTableName: 'users',
            targetColumnNames: ['id'],
            updateConstraint: 'RESTRICT',
            deleteConstraint: 'CASCADE',
          },
        }

        expect(value.tables['posts']?.constraints).toEqual(expected)
      })

      it('UNIQUE constraint', async () => {
        const { value } = await processor(
          JSON.stringify({
            name: 'testdb',
            tables: [
              {
                name: 'users',
                type: 'TABLE',
                columns: [{ name: 'id', type: 'int', nullable: false }],
                constraints: [
                  {
                    type: 'UNIQUE',
                    name: 'user_id',
                    def: 'UNIQUE (id)',
                    table: 'users',
                    columns: ['id'],
                  },
                ],
              },
            ],
          }),
        )

        const expected = {
          user_id: {
            type: 'UNIQUE',
            name: 'user_id',
            columnNames: ['id'],
          },
        }

        expect(value.tables['users']?.constraints).toEqual(expected)
      })

      it('CHECK constraint', async () => {
        const { value } = await processor(
          JSON.stringify({
            name: 'testdb',
            tables: [
              {
                name: 'users',
                type: 'TABLE',
                columns: [
                  { name: 'id', type: 'int', nullable: false },
                  { name: 'username', type: 'varchar(50)', nullable: false },
                ],
                constraints: [
                  {
                    name: 'users_chk_1',
                    type: 'CHECK',
                    def: 'CHECK ((char_length(`username`) > 4))',
                    table: 'users',
                  },
                ],
              },
            ],
          }),
        )

        const expected = {
          users_chk_1: {
            type: 'CHECK',
            name: 'users_chk_1',
            detail: 'CHECK ((char_length(`username`) > 4))',
          },
        }

        expect(value.tables['users']?.constraints).toEqual(expected)
      })
    })
  })
})
