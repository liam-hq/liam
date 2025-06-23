import { describe, expect, it } from 'vitest'
import { overrideSchema, type SchemaOverride } from './overrideSchema.js'
import type { Schema } from './schema.js'

describe('overrideSchema', () => {
  // Basic original schema for testing
  const originalSchema: Schema = {
    tables: {
      users: {
        name: 'users',
        comment: 'User accounts',
        columns: {
          id: {
            name: 'id',
            type: 'uuid',
            default: null,
            check: null,
            primary: true,
            notNull: true,
            comment: 'Primary key',
          },
          username: {
            name: 'username',
            type: 'varchar',
            default: null,
            check: null,
            primary: false,
            notNull: true,
            comment: 'Unique username',
          },
        },
        indexes: {
          users_username_idx: {
            name: 'users_username_idx',
            unique: false,
            columns: ['username'],
            type: '',
          },
        },
        constraints: {},
      },
    },
    relationships: {
      // Empty initially
    },
    tableGroups: {},
  }

  describe('Overriding existing tables', () => {
    it('should override a table comment', () => {
      const override: SchemaOverride = {
        overrides: {
          tables: {
            users: {
              comment: 'Updated user accounts table',
            },
          },
        },
      }

      const { schema } = overrideSchema(originalSchema, override)

      expect(schema.tables['users']?.comment).toBe(
        'Updated user accounts table',
      )
      // Original columns should be preserved
      expect(schema.tables['users']?.columns['id']).toBeDefined()
      expect(schema.tables['users']?.columns['username']).toBeDefined()
    })

    it('should throw an error when overriding a non-existent table', () => {
      const override: SchemaOverride = {
        overrides: {
          tables: {
            nonexistent: {
              comment: 'This table does not exist',
            },
          },
        },
      }

      expect(() => overrideSchema(originalSchema, override)).toThrowError(
        'Cannot override non-existent table: nonexistent',
      )
    })
  })

  describe('Overriding column comments', () => {
    it('should override column comments in an existing table', () => {
      const override: SchemaOverride = {
        overrides: {
          tables: {
            users: {
              columns: {
                id: {
                  comment: 'Updated primary key comment',
                },
                username: {
                  comment: 'Updated username comment',
                },
              },
            },
          },
        },
      }

      const { schema } = overrideSchema(originalSchema, override)

      expect(schema.tables['users']?.columns['id']?.comment).toBe(
        'Updated primary key comment',
      )
      expect(schema.tables['users']?.columns['username']?.comment).toBe(
        'Updated username comment',
      )
    })

    it('should throw an error when overriding a non-existent column', () => {
      const override: SchemaOverride = {
        overrides: {
          tables: {
            users: {
              columns: {
                nonexistent: {
                  comment: 'This column does not exist',
                },
              },
            },
          },
        },
      }

      expect(() => overrideSchema(originalSchema, override)).toThrowError(
        'Cannot override non-existent column nonexistent in table users',
      )
    })
  })

  describe('Table groups', () => {
    it('should handle table groups', () => {
      const override: SchemaOverride = {
        overrides: {
          tableGroups: {
            auth: {
              name: 'Authentication',
              tables: ['users'],
              comment: 'Tables related to authentication',
            },
          },
        },
      }

      const { tableGroups } = overrideSchema(originalSchema, override)

      expect(tableGroups['auth']).toBeDefined()
      expect(tableGroups['auth']?.name).toBe('Authentication')
      expect(tableGroups['auth']?.tables).toContain('users')
      expect(tableGroups['auth']?.comment).toBe(
        'Tables related to authentication',
      )
    })
  })

  describe('Complex scenarios', () => {
    it('should handle multiple override operations at once', () => {
      const schemaWithPostsForTest: Schema = {
        tables: {
          ...originalSchema.tables,
          posts: {
            name: 'posts',
            comment: 'Blog posts',
            columns: {
              id: {
                name: 'id',
                type: 'uuid',
                default: null,
                check: null,
                primary: true,
                notNull: true,
                comment: 'Primary key',
              },
              user_id: {
                name: 'user_id',
                type: 'uuid',
                default: null,
                check: null,
                primary: false,

                notNull: true,
                comment: 'Foreign key to users',
              },
              title: {
                name: 'title',
                type: 'varchar',
                default: null,
                check: null,
                primary: false,

                notNull: true,
                comment: 'Post title',
              },
            },
            indexes: {},
            constraints: {},
          },
        },
        relationships: {},
        tableGroups: {},
      }

      const override: SchemaOverride = {
        overrides: {
          tables: {
            users: {
              comment: 'User accounts with enhanced permissions',
              columns: {
                username: {
                  comment: 'User login name',
                },
              },
            },
            posts: {
              comment: 'User blog posts',
              columns: {
                title: {
                  comment: 'Post headline',
                },
              },
            },
          },
          tableGroups: {
            content: {
              name: 'Content',
              tables: ['posts'],
              comment: 'Content-related tables',
            },
            users: {
              name: 'Users',
              tables: ['users'],
              comment: 'User-related tables',
            },
          },
        },
      }

      const { schema, tableGroups } = overrideSchema(
        schemaWithPostsForTest,
        override,
      )

      expect(schema.tables['users']?.comment).toBe(
        'User accounts with enhanced permissions',
      )
      expect(schema.tables['posts']?.comment).toBe('User blog posts')

      expect(schema.tables['users']?.columns['username']?.comment).toBe(
        'User login name',
      )
      expect(schema.tables['posts']?.columns['title']?.comment).toBe(
        'Post headline',
      )

      expect(tableGroups['content']).toBeDefined()
      expect(tableGroups['users']).toBeDefined()
      expect(tableGroups['content']?.tables).toContain('posts')
      expect(tableGroups['users']?.tables).toContain('users')
    })
  })
})
