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

  describe('Adding new tables', () => {
    it('should add a new table to the schema', () => {
      const override: SchemaOverride = {
        overrides: {
          addTables: {
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
        },
      }

      const { schema } = overrideSchema(originalSchema, override)

      // Check if new table was added
      expect(schema.tables['posts']).toBeDefined()
      expect(schema.tables['posts']?.name).toBe('posts')
      expect(schema.tables['posts']?.comment).toBe('Blog posts')
      expect(schema.tables['posts']?.columns['title']).toBeDefined()

      // Check that the original table is still there
      expect(schema.tables['users']).toBeDefined()
    })

    it('should throw an error when adding a table that already exists', () => {
      const override: SchemaOverride = {
        overrides: {
          addTables: {
            users: {
              name: 'users',
              comment: 'Duplicate table',
              columns: {},
              indexes: {},
              constraints: {},
            },
          },
        },
      }

      expect(() => overrideSchema(originalSchema, override)).toThrowError(
        'Table users already exists in the database structure',
      )
    })
  })

  describe('Adding columns to existing tables', () => {
    it('should add new columns to an existing table', () => {
      const override: SchemaOverride = {
        overrides: {
          tables: {
            users: {
              addColumns: {
                email: {
                  name: 'email',
                  type: 'varchar',
                  default: null,
                  check: null,
                  primary: false,
                  unique: true,
                  notNull: true,
                  comment: 'User email address',
                },
                created_at: {
                  name: 'created_at',
                  type: 'timestamp',
                  default: 'now()',
                  check: null,
                  primary: false,
                  unique: false,
                  notNull: true,
                  comment: 'Creation timestamp',
                },
              },
            },
          },
        },
      }

      const { schema } = overrideSchema(originalSchema, override)

      // Check new columns were added
      expect(schema.tables['users']?.columns['email']).toBeDefined()
      expect(schema.tables['users']?.columns['email']?.type).toBe('varchar')
      expect(schema.tables['users']?.columns['email']?.comment).toBe(
        'User email address',
      )

      expect(schema.tables['users']?.columns['created_at']).toBeDefined()
      expect(schema.tables['users']?.columns['created_at']?.default).toBe(
        'now()',
      )

      // Original columns should still be there
      expect(schema.tables['users']?.columns['id']).toBeDefined()
      expect(schema.tables['users']?.columns['username']).toBeDefined()
    })

    it('should throw an error when adding a column that already exists', () => {
      const override: SchemaOverride = {
        overrides: {
          tables: {
            users: {
              addColumns: {
                username: {
                  name: 'username',
                  type: 'varchar',
                  default: null,
                  check: null,
                  primary: false,
                  unique: true,
                  notNull: true,
                  comment: 'Duplicate column',
                },
              },
            },
          },
        },
      }

      expect(() => overrideSchema(originalSchema, override)).toThrowError(
        'Column username already exists in table users',
      )
    })
  })

  describe('Adding relationships', () => {
    // For this test, we need a more complex schema with multiple tables
    const schemaWithPosts: Schema = {
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

    it('should add a new relationship', () => {
      const override: SchemaOverride = {
        overrides: {
          addRelationships: {
            posts_users_fk: {
              name: 'posts_users_fk',
              primaryTableName: 'users',
              primaryColumnName: 'id',
              foreignTableName: 'posts',
              foreignColumnName: 'user_id',
              cardinality: 'ONE_TO_MANY',
              updateConstraint: 'CASCADE',
              deleteConstraint: 'CASCADE',
            },
          },
        },
      }

      const { schema } = overrideSchema(schemaWithPosts, override)

      // Check if relationship was added
      expect(schema.relationships['posts_users_fk']).toBeDefined()
      expect(schema.relationships['posts_users_fk']?.cardinality).toBe(
        'ONE_TO_MANY',
      )
      expect(schema.relationships['posts_users_fk']?.primaryTableName).toBe(
        'users',
      )
      expect(schema.relationships['posts_users_fk']?.foreignTableName).toBe(
        'posts',
      )
    })

    it('should throw an error for duplicate relationship names', () => {
      // First add a relationship
      const schemaWithRelationship: Schema = {
        ...schemaWithPosts,
        relationships: {
          posts_users_fk: {
            name: 'posts_users_fk',
            primaryTableName: 'users',
            primaryColumnName: 'id',
            foreignTableName: 'posts',
            foreignColumnName: 'user_id',
            cardinality: 'ONE_TO_MANY',
            updateConstraint: 'CASCADE',
            deleteConstraint: 'CASCADE',
          },
        },
      }

      // Try to add a relationship with the same name
      const override: SchemaOverride = {
        overrides: {
          addRelationships: {
            posts_users_fk: {
              name: 'posts_users_fk',
              primaryTableName: 'users',
              primaryColumnName: 'id',
              foreignTableName: 'posts',
              foreignColumnName: 'user_id',
              cardinality: 'ONE_TO_ONE',
              updateConstraint: 'CASCADE',
              deleteConstraint: 'CASCADE',
            },
          },
        },
      }

      expect(() =>
        overrideSchema(schemaWithRelationship, override),
      ).toThrowError(
        'Relationship posts_users_fk already exists in the database structure',
      )
    })

    it('should throw an error when primary table does not exist', () => {
      const override: SchemaOverride = {
        overrides: {
          addRelationships: {
            invalid_fk: {
              name: 'invalid_fk',
              primaryTableName: 'nonexistent',
              primaryColumnName: 'id',
              foreignTableName: 'posts',
              foreignColumnName: 'user_id',
              cardinality: 'ONE_TO_MANY',
              updateConstraint: 'CASCADE',
              deleteConstraint: 'CASCADE',
            },
          },
        },
      }

      expect(() => overrideSchema(schemaWithPosts, override)).toThrowError(
        'Primary table nonexistent does not exist for relationship invalid_fk',
      )
    })

    it('should throw an error when primary column does not exist', () => {
      const override: SchemaOverride = {
        overrides: {
          addRelationships: {
            invalid_fk: {
              name: 'invalid_fk',
              primaryTableName: 'users',
              primaryColumnName: 'nonexistent',
              foreignTableName: 'posts',
              foreignColumnName: 'user_id',
              cardinality: 'ONE_TO_MANY',
              updateConstraint: 'CASCADE',
              deleteConstraint: 'CASCADE',
            },
          },
        },
      }

      expect(() => overrideSchema(schemaWithPosts, override)).toThrowError(
        'Primary column nonexistent does not exist in table users for relationship invalid_fk',
      )
    })

    it('should throw an error when foreign table does not exist', () => {
      const override: SchemaOverride = {
        overrides: {
          addRelationships: {
            invalid_fk: {
              name: 'invalid_fk',
              primaryTableName: 'users',
              primaryColumnName: 'id',
              foreignTableName: 'nonexistent',
              foreignColumnName: 'user_id',
              cardinality: 'ONE_TO_MANY',
              updateConstraint: 'CASCADE',
              deleteConstraint: 'CASCADE',
            },
          },
        },
      }

      expect(() => overrideSchema(schemaWithPosts, override)).toThrowError(
        'Foreign table nonexistent does not exist for relationship invalid_fk',
      )
    })

    it('should throw an error when foreign column does not exist', () => {
      const override: SchemaOverride = {
        overrides: {
          addRelationships: {
            invalid_fk: {
              name: 'invalid_fk',
              primaryTableName: 'users',
              primaryColumnName: 'id',
              foreignTableName: 'posts',
              foreignColumnName: 'nonexistent',
              cardinality: 'ONE_TO_MANY',
              updateConstraint: 'CASCADE',
              deleteConstraint: 'CASCADE',
            },
          },
        },
      }

      expect(() => overrideSchema(schemaWithPosts, override)).toThrowError(
        'Foreign column nonexistent does not exist in table posts for relationship invalid_fk',
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
          // Override existing table
          tables: {
            users: {
              comment: 'User accounts with enhanced permissions',
              // Add columns to existing table
              addColumns: {
                email: {
                  name: 'email',
                  type: 'varchar',
                  default: null,
                  check: null,
                  primary: false,
                  unique: true,
                  notNull: true,
                  comment: 'User email address',
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
          // Add relationship
          addRelationships: {
            posts_users_fk: {
              name: 'posts_users_fk',
              primaryTableName: 'users',
              primaryColumnName: 'id',
              foreignTableName: 'posts',
              foreignColumnName: 'user_id',
              cardinality: 'ONE_TO_MANY',
              updateConstraint: 'CASCADE',
              deleteConstraint: 'CASCADE',
            },
          },
          // Add table groups
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

      // Check table comments were updated
      expect(schema.tables['users']?.comment).toBe(
        'User accounts with enhanced permissions',
      )
      expect(schema.tables['posts']?.comment).toBe('User blog posts')

      // Check column comments were updated
      expect(schema.tables['posts']?.columns['title']?.comment).toBe(
        'Post headline',
      )

      // Check new column was added
      expect(schema.tables['users']?.columns['email']).toBeDefined()
      expect(schema.tables['users']?.columns['email']?.comment).toBe(
        'User email address',
      )

      // Check relationship was added
      expect(schema.relationships['posts_users_fk']).toBeDefined()
      expect(schema.relationships['posts_users_fk']?.cardinality).toBe(
        'ONE_TO_MANY',
      )

      // Check table groups were added
      expect(tableGroups['content']).toBeDefined()
      expect(tableGroups['users']).toBeDefined()
      expect(tableGroups['content']?.tables).toContain('posts')
      expect(tableGroups['users']?.tables).toContain('users')
    })
  })
})
