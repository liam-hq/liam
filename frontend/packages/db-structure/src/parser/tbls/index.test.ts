import { describe, expect, it } from 'vitest'
import type { Table } from '../../schema/index.js'
import { aColumn, aDBStructure, aTable, anIndex } from '../../schema/index.js'
import { processor } from './index.js'

describe(processor, () => {
  const userTable = (override?: Partial<Table>) =>
    aDBStructure({
      tables: {
        users: aTable({
          name: 'users',
          columns: {
            id: aColumn({
              name: 'id',
              type: 'int',
              notNull: true,
              primary: false,
              unique: false,
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
            unique: false,
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
            unique: true,
          }),
        },
        constraints: {
          users_email_key: {
            type: 'UNIQUE',
            name: 'users_email_key',
            columnName: 'email',
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
            unique: false,
          }),
        },
        indexes: {
          users_email_idx: anIndex({
            name: 'users_email_idx',
            columns: ['email'],
            type: 'btree',
            unique: false,
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
            unique: true,
            type: 'btree',
            columns: ['email'],
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
            primary: true,
            notNull: true,
          }),
        },
        constraints: {
          users_pkey: {
            type: 'PRIMARY KEY',
            name: 'users_pkey',
            columnName: 'id',
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

      const expected = aDBStructure({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({
                name: 'id',
                type: 'int',
                notNull: true,
                primary: false,
                unique: false,
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
            primary: false,
            unique: false,
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
            columnName: 'id',
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
            columnName: 'user_id',
            targetTableName: 'users',
            targetColumnName: 'id',
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
            columnName: 'id',
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

    describe('relationship', () => {
      const relationshipCases = [
        ['exactly_one', 'zero_or_one', 'ONE_TO_ONE'],
        ['exactly_one', 'zero_or_more', 'ONE_TO_MANY'],
        ['exactly_one', 'one_or_more', 'ONE_TO_MANY'],
      ]

      it.each(relationshipCases)(
        'relationship %s - %s',
        async (parentCardinality, cardinality, expectedCardinality) => {
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
                {
                  name: 'posts',
                  type: 'TABLE',
                  columns: [
                    {
                      name: 'id',
                      type: 'int',
                      nullable: false,
                    },
                    {
                      name: 'user_id',
                      type: 'int',
                      nullable: false,
                    },
                  ],
                },
              ],
              relations: [
                {
                  table: 'posts',
                  columns: ['user_id'],
                  cardinality: cardinality,
                  parent_table: 'users',
                  parent_columns: ['id'],
                  parent_cardinality: parentCardinality,
                  def: 'FOREIGN KEY (user_id) REFERENCES users (id)',
                },
              ],
            }),
          )

          const expected = {
            users_id_to_posts_user_id: {
              name: 'users_id_to_posts_user_id',
              primaryTableName: 'users',
              primaryColumnName: 'id',
              foreignTableName: 'posts',
              foreignColumnName: 'user_id',
              cardinality: expectedCardinality,
              updateConstraint: 'NO_ACTION',
              deleteConstraint: 'NO_ACTION',
            },
          }

          expect(value.relationships).toEqual(expected)
        },
      )

      it('foreign key with actions', async () => {
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
              {
                name: 'posts',
                type: 'TABLE',
                columns: [
                  {
                    name: 'id',
                    type: 'int',
                    nullable: false,
                  },
                  {
                    name: 'user_id',
                    type: 'int',
                    nullable: false,
                  },
                ],
              },
            ],
            relations: [
              {
                table: 'posts',
                columns: ['user_id'],
                cardinality: 'zero_or_more',
                parent_table: 'users',
                parent_columns: ['id'],
                parent_cardinality: 'exactly_one',
                def: 'FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE RESTRICT ON DELETE SET NULL',
              },
            ],
          }),
        )

        const expected = {
          users_id_to_posts_user_id: {
            name: 'users_id_to_posts_user_id',
            primaryTableName: 'users',
            primaryColumnName: 'id',
            foreignTableName: 'posts',
            foreignColumnName: 'user_id',
            cardinality: 'ONE_TO_MANY',
            updateConstraint: 'RESTRICT',
            deleteConstraint: 'SET_NULL',
          },
        }

        expect(value.relationships).toEqual(expected)
      })
    })
  })
})
