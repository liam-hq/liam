import { describe, expect, it } from 'vitest'
import { aColumn, aSchema, aTable } from '../../../schema/index.js'
import { deparser } from './deparser.js'
import { processor } from './index.js'

describe('PostgreSQL deparser', () => {
  it('should generate CREATE TABLE with basic columns', () => {
    const schema = aSchema({
      tables: {
        users: aTable({
          name: 'users',
          columns: {
            id: aColumn({
              name: 'id',
              type: 'bigserial',
              primary: true,
              notNull: true,
            }),
            name: aColumn({
              name: 'name',
              type: 'varchar(255)',
              notNull: true,
            }),
          },
          constraints: {
            PRIMARY_id: {
              name: 'PRIMARY_id',
              type: 'PRIMARY KEY',
              columnName: 'id',
            },
          },
        }),
      },
    })

    const { value: statements } = deparser(schema)

    expect(statements).toContain(expect.stringMatching(/CREATE TABLE users \(/))
    expect(statements.join('\n')).toMatch(/id BIGSERIAL NOT NULL/)
    expect(statements.join('\n')).toMatch(/name VARCHAR\(255\) NOT NULL/)
    expect(statements.join('\n')).toMatch(
      /CONSTRAINT PRIMARY_id PRIMARY KEY \(id\)/,
    )
  })

  it('should generate columns with default values', () => {
    const schema = aSchema({
      tables: {
        users: aTable({
          name: 'users',
          columns: {
            id: aColumn({
              name: 'id',
              type: 'serial',
              primary: true,
            }),
            description: aColumn({
              name: 'description',
              type: 'text',
              default: "user's description",
            }),
            age: aColumn({
              name: 'age',
              type: 'integer',
              default: 30,
            }),
            active: aColumn({
              name: 'active',
              type: 'boolean',
              default: true,
            }),
          },
          constraints: {
            PRIMARY_id: {
              name: 'PRIMARY_id',
              type: 'PRIMARY KEY',
              columnName: 'id',
            },
          },
        }),
      },
    })

    const { value: statements } = deparser(schema)
    const sql = statements.join('\n')

    expect(sql).toMatch(/description TEXT DEFAULT 'user''s description'/)
    expect(sql).toMatch(/age INTEGER DEFAULT 30/)
    expect(sql).toMatch(/active BOOLEAN DEFAULT true/)
  })

  it('should generate UNIQUE constraints', () => {
    const schema = aSchema({
      tables: {
        users: aTable({
          name: 'users',
          columns: {
            id: aColumn({
              name: 'id',
              type: 'serial',
              primary: true,
            }),
            email: aColumn({
              name: 'email',
              type: 'varchar(255)',
              unique: true,
            }),
          },
          constraints: {
            PRIMARY_id: {
              name: 'PRIMARY_id',
              type: 'PRIMARY KEY',
              columnName: 'id',
            },
          },
        }),
      },
    })

    const { value: statements } = deparser(schema)
    const sql = statements.join('\n')

    expect(sql).toMatch(/email VARCHAR\(255\) UNIQUE/)
  })

  it('should generate CHECK constraints', () => {
    const schema = aSchema({
      tables: {
        products: aTable({
          name: 'products',
          columns: {
            id: aColumn({
              name: 'id',
              type: 'serial',
              primary: true,
            }),
            price: aColumn({
              name: 'price',
              type: 'numeric',
            }),
          },
          constraints: {
            PRIMARY_id: {
              name: 'PRIMARY_id',
              type: 'PRIMARY KEY',
              columnName: 'id',
            },
            CHECK_price: {
              name: 'CHECK_price',
              type: 'CHECK',
              detail: 'CHECK (price > 0)',
            },
          },
        }),
      },
    })

    const { value: statements } = deparser(schema)
    const sql = statements.join('\n')

    expect(sql).toMatch(/CONSTRAINT CHECK_price CHECK \(price > 0\)/)
  })

  it('should generate foreign key constraints with ALTER TABLE', () => {
    const schema = aSchema({
      tables: {
        posts: aTable({
          name: 'posts',
          columns: {
            id: aColumn({ name: 'id', type: 'serial', primary: true }),
            user_id: aColumn({ name: 'user_id', type: 'integer' }),
          },
          constraints: {
            PRIMARY_id: {
              name: 'PRIMARY_id',
              type: 'PRIMARY KEY',
              columnName: 'id',
            },
          },
        }),
      },
      relationships: {
        fk_posts_user_id: {
          name: 'fk_posts_user_id',
          primaryTableName: 'users',
          primaryColumnName: 'id',
          foreignTableName: 'posts',
          foreignColumnName: 'user_id',
          cardinality: 'ONE_TO_MANY',
          updateConstraint: 'CASCADE',
          deleteConstraint: 'RESTRICT',
        },
      },
    })

    const { value: statements } = deparser(schema)

    expect(statements).toContain(
      'ALTER TABLE posts ADD CONSTRAINT fk_posts_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT;',
    )
  })

  it('should generate foreign key constraints with NO_ACTION (default)', () => {
    const schema = aSchema({
      tables: {
        posts: aTable({
          name: 'posts',
          columns: {
            id: aColumn({ name: 'id', type: 'serial', primary: true }),
            user_id: aColumn({ name: 'user_id', type: 'integer' }),
          },
          constraints: {
            PRIMARY_id: {
              name: 'PRIMARY_id',
              type: 'PRIMARY KEY',
              columnName: 'id',
            },
          },
        }),
      },
      relationships: {
        fk_posts_user_id: {
          name: 'fk_posts_user_id',
          primaryTableName: 'users',
          primaryColumnName: 'id',
          foreignTableName: 'posts',
          foreignColumnName: 'user_id',
          cardinality: 'ONE_TO_MANY',
          updateConstraint: 'NO_ACTION',
          deleteConstraint: 'NO_ACTION',
        },
      },
    })

    const { value: statements } = deparser(schema)

    expect(statements).toContain(
      'ALTER TABLE posts ADD CONSTRAINT fk_posts_user_id FOREIGN KEY (user_id) REFERENCES users(id);',
    )
  })

  it('should generate CREATE INDEX statements', () => {
    const schema = aSchema({
      tables: {
        users: aTable({
          name: 'users',
          columns: {
            id: aColumn({ name: 'id', type: 'serial', primary: true }),
            email: aColumn({ name: 'email', type: 'varchar(255)' }),
          },
          indexes: {
            index_users_on_email: {
              name: 'index_users_on_email',
              unique: false,
              columns: ['email'],
              type: 'btree',
            },
            unique_index_users_on_email: {
              name: 'unique_index_users_on_email',
              unique: true,
              columns: ['email'],
              type: 'btree',
            },
          },
          constraints: {
            PRIMARY_id: {
              name: 'PRIMARY_id',
              type: 'PRIMARY KEY',
              columnName: 'id',
            },
          },
        }),
      },
    })

    const { value: statements } = deparser(schema)

    expect(statements).toContain(
      'CREATE INDEX index_users_on_email ON users USING btree (email);',
    )
    expect(statements).toContain(
      'CREATE UNIQUE INDEX unique_index_users_on_email ON users USING btree (email);',
    )
  })

  it('should generate COMMENT statements', () => {
    const schema = aSchema({
      tables: {
        users: aTable({
          name: 'users',
          comment: 'store our users.',
          columns: {
            id: aColumn({
              name: 'id',
              type: 'serial',
              primary: true,
            }),
            description: aColumn({
              name: 'description',
              type: 'text',
              comment: 'this is description',
            }),
          },
          constraints: {
            PRIMARY_id: {
              name: 'PRIMARY_id',
              type: 'PRIMARY KEY',
              columnName: 'id',
            },
          },
        }),
      },
    })

    const { value: statements } = deparser(schema)

    expect(statements).toContain(
      "COMMENT ON TABLE users IS 'store our users.';",
    )
    expect(statements).toContain(
      "COMMENT ON COLUMN users.description IS 'this is description';",
    )
  })

  it('should escape single quotes in comments', () => {
    const schema = aSchema({
      tables: {
        users: aTable({
          name: 'users',
          comment: "user's table",
          columns: {
            id: aColumn({
              name: 'id',
              type: 'serial',
              primary: true,
              comment: "user's id",
            }),
          },
          constraints: {
            PRIMARY_id: {
              name: 'PRIMARY_id',
              type: 'PRIMARY KEY',
              columnName: 'id',
            },
          },
        }),
      },
    })

    const { value: statements } = deparser(schema)

    expect(statements).toContain("COMMENT ON TABLE users IS 'user''s table';")
    expect(statements).toContain("COMMENT ON COLUMN users.id IS 'user''s id';")
  })

  it('should handle empty schema', () => {
    const schema = aSchema({
      tables: {},
      relationships: {},
      tableGroups: {},
    })

    const { value: statements, errors } = deparser(schema)

    expect(statements).toEqual([])
    expect(errors).toEqual([])
  })

  describe('Round-trip conversion', () => {
    it('should maintain schema integrity through parse -> deparse -> parse cycle', async () => {
      const originalSchema = aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({
                name: 'id',
                type: 'bigserial',
                primary: true,
                notNull: true,
              }),
              email: aColumn({
                name: 'email',
                type: 'varchar(255)',
                unique: true,
                notNull: true,
              }),
            },
            constraints: {
              PRIMARY_id: {
                name: 'PRIMARY_id',
                type: 'PRIMARY KEY',
                columnName: 'id',
              },
            },
          }),
        },
      })

      const { value: sqlStatements } = deparser(originalSchema)
      const sql = sqlStatements.join('\n')

      const { value: reparsedSchema } = await processor(sql)

      expect(reparsedSchema.tables['users']?.name).toBe(
        originalSchema.tables['users']?.name,
      )
      expect(reparsedSchema.tables['users']?.columns['id']?.type).toBe(
        'bigserial',
      )
      expect(reparsedSchema.tables['users']?.columns['id']?.primary).toBe(true)
      expect(reparsedSchema.tables['users']?.columns['email']?.unique).toBe(
        true,
      )
      expect(reparsedSchema.tables['users']?.columns['email']?.notNull).toBe(
        true,
      )
    })

    it('should handle complex schema with relationships', async () => {
      const originalSchema = aSchema({
        tables: {
          users: aTable({
            name: 'users',
            columns: {
              id: aColumn({
                name: 'id',
                type: 'serial',
                primary: true,
              }),
            },
            constraints: {
              PRIMARY_id: {
                name: 'PRIMARY_id',
                type: 'PRIMARY KEY',
                columnName: 'id',
              },
            },
          }),
          posts: aTable({
            name: 'posts',
            columns: {
              id: aColumn({
                name: 'id',
                type: 'serial',
                primary: true,
              }),
              user_id: aColumn({
                name: 'user_id',
                type: 'integer',
              }),
            },
            constraints: {
              PRIMARY_id: {
                name: 'PRIMARY_id',
                type: 'PRIMARY KEY',
                columnName: 'id',
              },
            },
          }),
        },
        relationships: {
          fk_posts_user_id: {
            name: 'fk_posts_user_id',
            primaryTableName: 'users',
            primaryColumnName: 'id',
            foreignTableName: 'posts',
            foreignColumnName: 'user_id',
            cardinality: 'ONE_TO_MANY',
            updateConstraint: 'NO_ACTION',
            deleteConstraint: 'NO_ACTION',
          },
        },
      })

      const { value: sqlStatements } = deparser(originalSchema)
      const sql = sqlStatements.join('\n')

      const { value: reparsedSchema } = await processor(sql)

      expect(reparsedSchema.tables['users']).toBeDefined()
      expect(reparsedSchema.tables['posts']).toBeDefined()

      expect(Object.keys(reparsedSchema.relationships)).toHaveLength(1)
      const relationship = Object.values(reparsedSchema.relationships)[0]
      expect(relationship?.primaryTableName).toBe('users')
      expect(relationship?.foreignTableName).toBe('posts')
      expect(relationship?.foreignColumnName).toBe('user_id')
    })
  })
})
