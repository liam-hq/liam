import { describe, expect, it } from 'vitest'
import mysqlSchema from './input/mysql/schema.json'
import postgresqlSchema from './input/postgresql/schema.json'
import schema from './schema.generated'

describe('tbls schema validation', () => {
  it('validates correct schema structure', () => {
    const validSchema = {
      name: 'test_db',
      tables: [
        {
          name: 'users',
          type: 'TABLE',
          columns: [
            {
              name: 'id',
              type: 'integer',
              nullable: false,
            },
            {
              name: 'name',
              type: 'varchar(255)',
              nullable: true,
              default: null,
              comment: 'Username',
            },
          ],
          indexes: [
            {
              name: 'users_pkey',
              def: 'PRIMARY KEY (id)',
              table: 'users',
              columns: ['id'],
            },
          ],
        },
      ],
    }

    const result = schema.safeParse(validSchema)
    expect(result.success).toBe(true)
  })

  it('fails when required fields are missing', () => {
    const invalidSchema = {
      name: 'test_db',
      tables: [
        {
          // name field is missing
          type: 'TABLE',
          columns: [],
        },
      ],
    }

    const result = schema.safeParse(invalidSchema)
    expect(result.success).toBe(false)
  })

  it('validates schema with relationships', () => {
    const schemaWithRelations = {
      name: 'test_db',
      tables: [
        {
          name: 'users',
          type: 'TABLE',
          columns: [
            {
              name: 'id',
              type: 'integer',
              nullable: false,
            },
          ],
        },
      ],
      relations: [
        {
          table: 'posts',
          columns: ['user_id'],
          parent_table: 'users',
          parent_columns: ['id'],
          def: 'FOREIGN KEY (user_id) REFERENCES users(id)',
          cardinality: 'zero_or_more',
        },
      ],
    }

    const result = schema.safeParse(schemaWithRelations)
    expect(result.success).toBe(true)
  })

  it('validates mysql schema.json', () => {
    const result = schema.safeParse(mysqlSchema)
    expect(result.success).toBe(true)
  })

  it('validates postgresql schema.json', () => {
    const result = schema.safeParse(postgresqlSchema)
    expect(result.success).toBe(true)
  })
})
