import { describe, expect, it } from 'vitest'
import { type SchemaOverride, overrideSchema } from './overrideSchema.js'
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
            unique: true,
            notNull: true,
            comment: 'Primary key',
          },
          username: {
            name: 'username',
            type: 'varchar',
            default: null,
            check: null,
            primary: false,
            unique: true,
            notNull: true,
            comment: 'Unique username',
          },
        },
        indexes: {
          users_username_idx: {
            name: 'users_username_idx',
            unique: true,
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

  // Schema with relationships for testing
  const schemaWithRelationships: Schema = {
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
            unique: true,
            notNull: true,
            comment: 'Primary key',
          },
          user_id: {
            name: 'user_id',
            type: 'uuid',
            default: null,
            check: null,
            primary: false,
            unique: false,
            notNull: true,
            comment: 'Foreign key to users',
          },
          title: {
            name: 'title',
            type: 'varchar',
            default: null,
            check: null,
            primary: false,
            unique: false,
            notNull: true,
            comment: 'Post title',
          },
        },
        indexes: {},
        constraints: {},
      },
    },
    relationships: {
      posts_users: {
        name: 'posts_users',
        primaryTableName: 'users',
        primaryColumnName: 'id',
        foreignTableName: 'posts',
        foreignColumnName: 'user_id',
        cardinality: 'ONE_TO_MANY',
        updateConstraint: 'CASCADE',
        deleteConstraint: 'CASCADE',
      },
    },
    tableGroups: {
      content: {
        name: 'Content',
        tables: ['posts'],
        comment: 'Content-related tables',
      },
    },
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

  describe('Operation: addTable', () => {
    it('should add a new table to the schema', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'addTable',
              table: {
                name: 'comments',
                comment: 'Post comments',
                columns: {
                  id: {
                    name: 'id',
                    type: 'uuid',
                    default: null,
                    check: null,
                    primary: true,
                    unique: true,
                    notNull: true,
                    comment: 'Primary key',
                  },
                  post_id: {
                    name: 'post_id',
                    type: 'uuid',
                    default: null,
                    check: null,
                    primary: false,
                    unique: false,
                    notNull: true,
                    comment: 'Foreign key to posts',
                  },
                  content: {
                    name: 'content',
                    type: 'text',
                    default: null,
                    check: null,
                    primary: false,
                    unique: false,
                    notNull: true,
                    comment: 'Comment content',
                  },
                },
                indexes: {},
                constraints: {},
              },
            },
          ],
        },
      }

      const { schema } = overrideSchema(originalSchema, override)

      expect(schema.tables['comments']).toBeDefined()
      expect(schema.tables['comments']?.comment).toBe('Post comments')
      expect(schema.tables['comments']?.columns['id']).toBeDefined()
      expect(schema.tables['comments']?.columns['post_id']).toBeDefined()
      expect(schema.tables['comments']?.columns['content']).toBeDefined()
      expect(schema.tables['comments']?.columns['content']?.type).toBe('text')
    })

    it('should throw an error when adding a table that already exists', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'addTable',
              table: {
                name: 'users', // Already exists
                comment: 'Duplicate table',
                columns: {
                  id: {
                    name: 'id',
                    type: 'uuid',
                    default: null,
                    check: null,
                    primary: true,
                    unique: true,
                    notNull: true,
                    comment: 'Primary key',
                  },
                },
                indexes: {},
                constraints: {},
              },
            },
          ],
        },
      }

      expect(() => overrideSchema(originalSchema, override)).toThrowError(
        'Table already exists: users',
      )
    })
  })

  describe('Operation: deleteTable', () => {
    it('should delete an existing table from the schema', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'deleteTable',
              tableName: 'users',
            },
          ],
        },
      }

      const { schema } = overrideSchema(originalSchema, override)

      expect(schema.tables['users']).toBeUndefined()
    })

    it('should throw an error when deleting a non-existent table', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'deleteTable',
              tableName: 'nonexistent',
            },
          ],
        },
      }

      expect(() => overrideSchema(originalSchema, override)).toThrowError(
        'Cannot delete non-existent table: nonexistent',
      )
    })

    it('should remove relationships involving the deleted table', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'deleteTable',
              tableName: 'posts',
            },
          ],
        },
      }

      const { schema } = overrideSchema(schemaWithRelationships, override)

      // Table should be deleted
      expect(schema.tables['posts']).toBeUndefined()
      // Relationship should be deleted
      expect(schema.relationships['posts_users']).toBeUndefined()
    })

    it('should remove the deleted table from table groups', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'deleteTable',
              tableName: 'posts',
            },
          ],
        },
      }

      const { schema, tableGroups } = overrideSchema(
        schemaWithRelationships,
        override,
      )

      // Table should be deleted
      expect(schema.tables['posts']).toBeUndefined()
      // Table should be removed from the group
      expect(tableGroups['content'].tables).not.toContain('posts')
      expect(tableGroups['content'].tables.length).toBe(0)
    })
  })

  describe('Combined operations', () => {
    it('should handle multiple operations in the correct order', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'deleteTable',
              tableName: 'users',
            },
            {
              type: 'addTable',
              table: {
                name: 'new_users',
                comment: 'Replacement users table',
                columns: {
                  id: {
                    name: 'id',
                    type: 'uuid',
                    default: null,
                    check: null,
                    primary: true,
                    unique: true,
                    notNull: true,
                    comment: 'Primary key',
                  },
                  name: {
                    name: 'name',
                    type: 'varchar',
                    default: null,
                    check: null,
                    primary: false,
                    unique: false,
                    notNull: true,
                    comment: 'User full name',
                  },
                },
                indexes: {},
                constraints: {},
              },
            },
          ],
          tableGroups: {
            auth: {
              name: 'Authentication',
              tables: ['new_users'],
              comment: 'Auth tables',
            },
          },
        },
      }

      const { schema, tableGroups } = overrideSchema(originalSchema, override)

      // Original table should be deleted
      expect(schema.tables['users']).toBeUndefined()
      // New table should be added
      expect(schema.tables['new_users']).toBeDefined()
      expect(schema.tables['new_users']?.comment).toBe('Replacement users table')
      // Table group should reference new table
      expect(tableGroups['auth']).toBeDefined()
      expect(tableGroups['auth']?.tables).toContain('new_users')
    })

    it('should apply operations before other overrides', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'addTable',
              table: {
                name: 'comments',
                comment: 'Basic comments',
                columns: {
                  id: {
                    name: 'id',
                    type: 'uuid',
                    default: null,
                    check: null,
                    primary: true,
                    unique: true,
                    notNull: true, 
                    comment: 'ID',
                  },
                },
                indexes: {},
                constraints: {},
              },
            },
          ],
          tables: {
            comments: {
              comment: 'User comments with enhanced features',
              columns: {
                id: {
                  comment: 'Primary identifier',
                },
              },
            },
          },
        },
      }

      const { schema } = overrideSchema(originalSchema, override)

      // Table should be added by operation
      expect(schema.tables['comments']).toBeDefined()
      // Comment should be updated by subsequent override
      expect(schema.tables['comments']?.comment).toBe(
        'User comments with enhanced features',
      )
      // Column comment should be updated by override
      expect(schema.tables['comments']?.columns['id']?.comment).toBe(
        'Primary identifier',
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
                unique: true,
                notNull: true,
                comment: 'Primary key',
              },
              user_id: {
                name: 'user_id',
                type: 'uuid',
                default: null,
                check: null,
                primary: false,
                unique: false,
                notNull: true,
                comment: 'Foreign key to users',
              },
              title: {
                name: 'title',
                type: 'varchar',
                default: null,
                check: null,
                primary: false,
                unique: false,
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
