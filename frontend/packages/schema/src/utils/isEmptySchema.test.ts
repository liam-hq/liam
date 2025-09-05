import { describe, expect, it } from 'vitest'
import { aColumn, aSchema, aTable } from '../schema'
import { isEmptySchema } from './isEmptySchema'

describe('isEmptySchema', () => {
  it('should return true for completely empty schema', () => {
    const emptySchema = aSchema({
      tables: {},
      enums: {},
      extensions: {},
    })

    expect(isEmptySchema(emptySchema)).toBe(true)
  })

  it('should return false when using default aSchema (contains default users table)', () => {
    const defaultSchema = aSchema({})

    expect(isEmptySchema(defaultSchema)).toBe(false)
  })

  it('should return false when schema has tables', () => {
    const schemaWithTable = aSchema({
      tables: {
        users: aTable({
          name: 'users',
          columns: {
            id: aColumn({
              name: 'id',
              type: 'uuid',
              notNull: true,
            }),
          },
        }),
      },
      enums: {},
      extensions: {},
    })

    expect(isEmptySchema(schemaWithTable)).toBe(false)
  })

  it('should return false when schema has enums', () => {
    const schemaWithEnum = aSchema({
      tables: {},
      enums: {
        user_role: {
          name: 'user_role',
          values: ['admin', 'user'],
          comment: null,
        },
      },
      extensions: {},
    })

    expect(isEmptySchema(schemaWithEnum)).toBe(false)
  })

  it('should return false when schema has extensions', () => {
    const schemaWithExtension = aSchema({
      tables: {},
      enums: {},
      extensions: {
        uuid_ossp: {
          name: 'uuid-ossp',
        },
      },
    })

    expect(isEmptySchema(schemaWithExtension)).toBe(false)
  })

  it('should return false when schema has multiple non-empty properties', () => {
    const fullSchema = aSchema({
      tables: {
        users: aTable({
          name: 'users',
          columns: {
            id: aColumn({
              name: 'id',
              type: 'uuid',
              notNull: true,
            }),
          },
        }),
      },
      enums: {
        user_role: {
          name: 'user_role',
          values: ['admin', 'user'],
          comment: null,
        },
      },
      extensions: {
        uuid_ossp: {
          name: 'uuid-ossp',
        },
      },
    })

    expect(isEmptySchema(fullSchema)).toBe(false)
  })

  it('should handle mixed empty and non-empty properties correctly', () => {
    const mixedSchema = aSchema({
      tables: {
        users: aTable({
          name: 'users',
          columns: {
            id: aColumn({
              name: 'id',
              type: 'uuid',
              notNull: true,
            }),
          },
        }),
      },
      enums: {}, // empty
      extensions: {}, // empty
    })

    expect(isEmptySchema(mixedSchema)).toBe(false)
  })
})
