import { describe, expect, it } from 'vitest'
import type { DBStructure } from './dbStructure.js'
import { type DBOverride, applyOverrides } from './overrideDbStructure.js'

describe('overrideDbStructure', () => {
  // Basic original DB structure for testing
  const originalStructure: DBStructure = {
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
        indices: {
          users_username_idx: {
            name: 'users_username_idx',
            unique: true,
            columns: ['username'],
          },
        },
      },
    },
    relationships: {
      // Empty initially
    },
  }

  describe('Adding new tables', () => {
    it('should add a new table to the DB structure', () => {
      const override: DBOverride = {
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
              indices: {},
            },
          },
        },
      }

      const result = applyOverrides(originalStructure, override)

      // Check if new table was added
      expect(result.tables['posts']).toBeDefined()
      expect(result.tables['posts']?.name).toBe('posts')
      expect(result.tables['posts']?.comment).toBe('Blog posts')
      expect(result.tables['posts']?.columns['title']).toBeDefined()

      // Check that the original table is still there
      expect(result.tables['users']).toBeDefined()
    })

    it('should throw an error when adding a table that already exists', () => {
      const override: DBOverride = {
        overrides: {
          addTables: {
            users: {
              name: 'users',
              comment: 'Duplicate table',
              columns: {},
              indices: {},
            },
          },
        },
      }

      expect(() => applyOverrides(originalStructure, override)).toThrowError(
        'Table users already exists in the database structure',
      )
    })
  })

  describe('Overriding existing tables', () => {
    it('should override a table comment', () => {
      const override: DBOverride = {
        overrides: {
          tables: {
            users: {
              comment: 'Updated user accounts table',
            },
          },
        },
      }

      const result = applyOverrides(originalStructure, override)

      expect(result.tables['users']?.comment).toBe(
        'Updated user accounts table',
      )
      // Original columns should be preserved
      expect(result.tables['users']?.columns['id']).toBeDefined()
      expect(result.tables['users']?.columns['username']).toBeDefined()
    })

    it('should throw an error when overriding a non-existent table', () => {
      const override: DBOverride = {
        overrides: {
          tables: {
            nonexistent: {
              comment: 'This table does not exist',
            },
          },
        },
      }

      expect(() => applyOverrides(originalStructure, override)).toThrowError(
        'Cannot override non-existent table: nonexistent',
      )
    })
  })

  describe('Adding columns to existing tables', () => {
    it('should add new columns to an existing table', () => {
      const override: DBOverride = {
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

      const result = applyOverrides(originalStructure, override)

      // Check new columns were added
      expect(result.tables['users']?.columns['email']).toBeDefined()
      expect(result.tables['users']?.columns['email']?.type).toBe('varchar')
      expect(result.tables['users']?.columns['email']?.comment).toBe(
        'User email address',
      )

      expect(result.tables['users']?.columns['created_at']).toBeDefined()
      expect(result.tables['users']?.columns['created_at']?.default).toBe(
        'now()',
      )

      // Original columns should still be there
      expect(result.tables['users']?.columns['id']).toBeDefined()
      expect(result.tables['users']?.columns['username']).toBeDefined()
    })

    it('should throw an error when adding a column that already exists', () => {
      const override: DBOverride = {
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

      expect(() => applyOverrides(originalStructure, override)).toThrowError(
        'Column username already exists in table users',
      )
    })
  })

  describe('Adding relationships', () => {
    // For this test, we need a more complex DB structure with multiple tables
    const structureWithPosts: DBStructure = {
      tables: {
        ...originalStructure.tables,
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
          indices: {},
        },
      },
      relationships: {},
    }

    it('should add a new relationship', () => {
      const override: DBOverride = {
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

      const result = applyOverrides(structureWithPosts, override)

      // Check if relationship was added
      expect(result.relationships['posts_users_fk']).toBeDefined()
      expect(result.relationships['posts_users_fk']?.cardinality).toBe(
        'ONE_TO_MANY',
      )
      expect(result.relationships['posts_users_fk']?.primaryTableName).toBe(
        'users',
      )
      expect(result.relationships['posts_users_fk']?.foreignTableName).toBe(
        'posts',
      )
    })

    it('should throw an error for duplicate relationship names', () => {
      // First add a relationship
      const structureWithRelationship: DBStructure = {
        ...structureWithPosts,
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
      const override: DBOverride = {
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
        applyOverrides(structureWithRelationship, override),
      ).toThrowError(
        'Relationship posts_users_fk already exists in the database structure',
      )
    })

    it('should throw an error when primary table does not exist', () => {
      const override: DBOverride = {
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

      expect(() => applyOverrides(structureWithPosts, override)).toThrowError(
        'Primary table nonexistent does not exist for relationship invalid_fk',
      )
    })

    it('should throw an error when primary column does not exist', () => {
      const override: DBOverride = {
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

      expect(() => applyOverrides(structureWithPosts, override)).toThrowError(
        'Primary column nonexistent does not exist in table users for relationship invalid_fk',
      )
    })

    it('should throw an error when foreign table does not exist', () => {
      const override: DBOverride = {
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

      expect(() => applyOverrides(structureWithPosts, override)).toThrowError(
        'Foreign table nonexistent does not exist for relationship invalid_fk',
      )
    })

    it('should throw an error when foreign column does not exist', () => {
      const override: DBOverride = {
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

      expect(() => applyOverrides(structureWithPosts, override)).toThrowError(
        'Foreign column nonexistent does not exist in table posts for relationship invalid_fk',
      )
    })
  })

  describe('Complex scenarios', () => {
    it('should handle multiple override operations at once', () => {
      const override: DBOverride = {
        overrides: {
          // Add a new table
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
              },
              indices: {},
            },
          },
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
        },
      }

      const result = applyOverrides(originalStructure, override)

      // Check new table was added
      expect(result.tables['posts']).toBeDefined()

      // Check table comment was updated
      expect(result.tables['users']?.comment).toBe(
        'User accounts with enhanced permissions',
      )

      // Check new column was added
      expect(result.tables['users']?.columns['email']).toBeDefined()

      // Check relationship was added
      expect(result.relationships['posts_users_fk']).toBeDefined()
      expect(result.relationships['posts_users_fk']?.cardinality).toBe(
        'ONE_TO_MANY',
      )
    })
  })
})
