import { describe, expect, it } from 'vitest'
import { aSchema, aTable } from '../../../schema/factories.js'
import { mergeSchemas } from './mergeSchemas.js'

describe('mergeSchemas', () => {
  it('should merge constraints correctly', () => {
    const target = aSchema({
      tables: {
        users: aTable({
          name: 'users',
          constraints: {
            users_email_key: {
              name: 'users_email_key',
              type: 'UNIQUE',
              columnNames: ['email'],
            },
          },
        }),
      },
    })

    const source = aSchema({
      tables: {
        users: aTable({
          name: 'users',
          constraints: {
            users_pkey: {
              name: 'users_pkey',
              type: 'PRIMARY KEY',
              columnNames: ['id'],
            },
          },
        }),
      },
    })

    mergeSchemas(target, source)

    // Both constraints should be preserved
    expect(target.tables['users']?.constraints).toEqual({
      users_email_key: {
        name: 'users_email_key',
        type: 'UNIQUE',
        columnNames: ['email'],
      },
      users_pkey: {
        name: 'users_pkey',
        type: 'PRIMARY KEY',
        columnNames: ['id'],
      },
    })
  })

  it('should merge multiple tables with constraints', () => {
    const target = aSchema({
      tables: {
        users: aTable({
          name: 'users',
          constraints: {
            users_email_key: {
              name: 'users_email_key',
              type: 'UNIQUE',
              columnNames: ['email'],
            },
          },
        }),
        posts: aTable({
          name: 'posts',
        }),
      },
    })

    const source = aSchema({
      tables: {
        users: aTable({
          name: 'users',
          constraints: {
            users_pkey: {
              name: 'users_pkey',
              type: 'PRIMARY KEY',
              columnNames: ['id'],
            },
          },
        }),
        posts: aTable({
          name: 'posts',
          constraints: {
            posts_pkey: {
              name: 'posts_pkey',
              type: 'PRIMARY KEY',
              columnNames: ['id'],
            },
          },
        }),
      },
    })

    mergeSchemas(target, source)

    // All constraints should be preserved
    expect(target.tables['users']?.constraints).toEqual({
      users_email_key: {
        name: 'users_email_key',
        type: 'UNIQUE',
        columnNames: ['email'],
      },
      users_pkey: {
        name: 'users_pkey',
        type: 'PRIMARY KEY',
        columnNames: ['id'],
      },
    })

    expect(target.tables['posts']?.constraints).toEqual({
      posts_pkey: {
        name: 'posts_pkey',
        type: 'PRIMARY KEY',
        columnNames: ['id'],
      },
    })
  })
})
