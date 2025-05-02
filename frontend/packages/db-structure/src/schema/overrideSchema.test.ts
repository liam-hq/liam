import { assert, describe, expect, it } from 'vitest'
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
      expect(tableGroups['content']?.tables).not.toContain('posts')
      expect(tableGroups['content']?.tables.length).toBe(0)
    })
  })

  describe('Operation: addColumn', () => {
    it('should add a new column to an existing table', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'addColumn',
              tableName: 'users',
              columnName: 'email',
              column: {
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
          ],
        },
      }

      const { schema } = overrideSchema(originalSchema, override)

      // Column should be added
      expect(schema.tables['users']?.columns['email']).toBeDefined()
      expect(schema.tables['users']?.columns['email']?.type).toBe('varchar')
      expect(schema.tables['users']?.columns['email']?.comment).toBe(
        'User email address',
      )
      expect(schema.tables['users']?.columns['email']?.unique).toBe(true)

      // Original columns should be preserved
      expect(schema.tables['users']?.columns['id']).toBeDefined()
      expect(schema.tables['users']?.columns['username']).toBeDefined()
    })

    it('should throw an error when adding a column to a non-existent table', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'addColumn',
              tableName: 'nonexistent',
              columnName: 'test',
              column: {
                name: 'test',
                type: 'varchar',
                default: null,
                check: null,
                primary: false,
                unique: false,
                notNull: true,
                comment: 'Test column',
              },
            },
          ],
        },
      }

      expect(() => overrideSchema(originalSchema, override)).toThrowError(
        'Cannot add column to non-existent table: nonexistent',
      )
    })

    it('should throw an error when adding a column that already exists', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'addColumn',
              tableName: 'users',
              columnName: 'username', // Already exists
              column: {
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
          ],
        },
      }

      expect(() => overrideSchema(originalSchema, override)).toThrowError(
        'Column already exists: username in table users',
      )
    })
  })

  describe('Operation: deleteColumn', () => {
    it('should delete an existing column from a table', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'deleteColumn',
              tableName: 'users',
              columnName: 'username',
            },
          ],
        },
      }

      const { schema } = overrideSchema(originalSchema, override)

      // Column should be deleted
      expect(schema.tables['users']?.columns['username']).toBeUndefined()

      // Other columns should remain
      expect(schema.tables['users']?.columns['id']).toBeDefined()
    })

    it('should throw an error when deleting a column from a non-existent table', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'deleteColumn',
              tableName: 'nonexistent',
              columnName: 'test',
            },
          ],
        },
      }

      expect(() => overrideSchema(originalSchema, override)).toThrowError(
        'Cannot delete column from non-existent table: nonexistent',
      )
    })

    it('should throw an error when deleting a non-existent column', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'deleteColumn',
              tableName: 'users',
              columnName: 'nonexistent',
            },
          ],
        },
      }

      expect(() => overrideSchema(originalSchema, override)).toThrowError(
        'Cannot delete non-existent column: nonexistent from table users',
      )
    })

    it('should remove relationships involving the deleted column', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'deleteColumn',
              tableName: 'posts',
              columnName: 'user_id',
            },
          ],
        },
      }

      const { schema } = overrideSchema(schemaWithRelationships, override)

      // Column should be deleted
      expect(schema.tables['posts']?.columns['user_id']).toBeUndefined()

      // Relationship should be deleted
      expect(schema.relationships['posts_users']).toBeUndefined()
    })

    it('should remove the column from indexes', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'deleteColumn',
              tableName: 'users',
              columnName: 'username',
            },
          ],
        },
      }

      const { schema } = overrideSchema(originalSchema, override)

      // The index that only contained this column should be deleted
      expect(
        schema.tables['users']?.indexes['users_username_idx'],
      ).toBeUndefined()
    })
  })

  describe('Operation: updateColumn', () => {
    it('should update column properties in a table', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'updateColumn',
              tableName: 'users',
              columnName: 'username',
              properties: {
                type: 'text', // Change from varchar to text
                unique: false, // Change unique constraint
                comment: 'Updated username comment',
              },
            },
          ],
        },
      }

      const { schema } = overrideSchema(originalSchema, override)

      // Column properties should be updated
      expect(schema.tables['users']?.columns['username']?.type).toBe('text')
      expect(schema.tables['users']?.columns['username']?.unique).toBe(false)
      expect(schema.tables['users']?.columns['username']?.comment).toBe(
        'Updated username comment',
      )

      // Other properties should remain unchanged
      expect(schema.tables['users']?.columns['username']?.notNull).toBe(true)
      expect(schema.tables['users']?.columns['username']?.primary).toBe(false)
    })

    it('should throw an error when updating a column in a non-existent table', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'updateColumn',
              tableName: 'nonexistent',
              columnName: 'test',
              properties: {
                type: 'text',
              },
            },
          ],
        },
      }

      expect(() => overrideSchema(originalSchema, override)).toThrowError(
        'Cannot update column in non-existent table: nonexistent',
      )
    })

    it('should throw an error when updating a non-existent column', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'updateColumn',
              tableName: 'users',
              columnName: 'nonexistent',
              properties: {
                type: 'text',
              },
            },
          ],
        },
      }

      expect(() => overrideSchema(originalSchema, override)).toThrowError(
        'Cannot update non-existent column: nonexistent in table users',
      )
    })

    it('should only update specified properties', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'updateColumn',
              tableName: 'users',
              columnName: 'username',
              properties: {
                comment: 'Only update comment',
              },
            },
          ],
        },
      }

      const { schema } = overrideSchema(originalSchema, override)

      // Only comment should be updated
      expect(schema.tables['users']?.columns['username']?.comment).toBe(
        'Only update comment',
      )

      // Other properties should remain unchanged
      expect(schema.tables['users']?.columns['username']?.type).toBe('varchar')
      expect(schema.tables['users']?.columns['username']?.unique).toBe(true)
      expect(schema.tables['users']?.columns['username']?.notNull).toBe(true)
    })
  })

  describe('Operation: addIndex', () => {
    it('should add a new index to a table', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'addIndex',
              tableName: 'users',
              indexName: 'users_id_idx',
              index: {
                name: 'users_id_idx',
                unique: true,
                columns: ['id'],
                type: 'btree',
              },
            },
          ],
        },
      }

      const { schema } = overrideSchema(originalSchema, override)

      // Index should be added
      expect(schema.tables['users']?.indexes['users_id_idx']).toBeDefined()
      expect(schema.tables['users']?.indexes['users_id_idx']?.unique).toBe(true)
      expect(
        schema.tables['users']?.indexes['users_id_idx']?.columns,
      ).toContain('id')
      expect(schema.tables['users']?.indexes['users_id_idx']?.type).toBe(
        'btree',
      )

      // Existing indexes should remain
      expect(
        schema.tables['users']?.indexes['users_username_idx'],
      ).toBeDefined()
    })

    it('should throw an error when adding an index to a non-existent table', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'addIndex',
              tableName: 'nonexistent',
              indexName: 'test_idx',
              index: {
                name: 'test_idx',
                unique: true,
                columns: ['id'],
                type: 'btree',
              },
            },
          ],
        },
      }

      expect(() => overrideSchema(originalSchema, override)).toThrowError(
        'Cannot add index to non-existent table: nonexistent',
      )
    })

    it('should throw an error when adding an index that already exists', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'addIndex',
              tableName: 'users',
              indexName: 'users_username_idx', // Already exists
              index: {
                name: 'users_username_idx',
                unique: true,
                columns: ['username'],
                type: 'btree',
              },
            },
          ],
        },
      }

      expect(() => overrideSchema(originalSchema, override)).toThrowError(
        'Index already exists: users_username_idx in table users',
      )
    })

    it('should throw an error when adding an index with non-existent columns', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'addIndex',
              tableName: 'users',
              indexName: 'users_nonexistent_idx',
              index: {
                name: 'users_nonexistent_idx',
                unique: true,
                columns: ['nonexistent'],
                type: 'btree',
              },
            },
          ],
        },
      }

      expect(() => overrideSchema(originalSchema, override)).toThrowError(
        'Cannot create index with non-existent column: nonexistent in table users',
      )
    })
  })

  describe('Operation: deleteIndex', () => {
    it('should delete an existing index from a table', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'deleteIndex',
              tableName: 'users',
              indexName: 'users_username_idx',
            },
          ],
        },
      }

      const { schema } = overrideSchema(originalSchema, override)

      // Index should be deleted
      expect(
        schema.tables['users']?.indexes['users_username_idx'],
      ).toBeUndefined()
    })

    it('should throw an error when deleting an index from a non-existent table', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'deleteIndex',
              tableName: 'nonexistent',
              indexName: 'test_idx',
            },
          ],
        },
      }

      expect(() => overrideSchema(originalSchema, override)).toThrowError(
        'Cannot delete index from non-existent table: nonexistent',
      )
    })

    it('should throw an error when deleting a non-existent index', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'deleteIndex',
              tableName: 'users',
              indexName: 'nonexistent_idx',
            },
          ],
        },
      }

      expect(() => overrideSchema(originalSchema, override)).toThrowError(
        'Cannot delete non-existent index: nonexistent_idx from table users',
      )
    })
  })

  describe('Operation: addConstraint', () => {
    it('should add a primary key constraint to a table', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'addConstraint',
              tableName: 'users',
              constraintName: 'users_pk',
              constraint: {
                type: 'PRIMARY KEY',
                name: 'users_pk',
                columnName: 'id',
              },
            },
          ],
        },
      }

      const { schema } = overrideSchema(originalSchema, override)

      // Constraint should be added
      expect(schema.tables['users']?.constraints['users_pk']).toBeDefined()
      expect(schema.tables['users']?.constraints['users_pk']?.type).toBe(
        'PRIMARY KEY',
      )
      const pkConstraint = schema.tables['users']?.constraints['users_pk']
      if (pkConstraint && pkConstraint.type === 'PRIMARY KEY') {
        expect(pkConstraint.columnName).toBe('id')
      } else {
        assert.fail('Expected PRIMARY KEY constraint with columnName property')
      }
    })

    it('should add a unique constraint to a table', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'addConstraint',
              tableName: 'users',
              constraintName: 'users_username_unique',
              constraint: {
                type: 'UNIQUE',
                name: 'users_username_unique',
                columnName: 'username',
              },
            },
          ],
        },
      }

      const { schema } = overrideSchema(originalSchema, override)

      // Constraint should be added
      expect(
        schema.tables['users']?.constraints['users_username_unique'],
      ).toBeDefined()
      expect(
        schema.tables['users']?.constraints['users_username_unique']?.type,
      ).toBe('UNIQUE')
      const uniqueConstraint =
        schema.tables['users']?.constraints['users_username_unique']
      if (uniqueConstraint && uniqueConstraint.type === 'UNIQUE') {
        expect(uniqueConstraint.columnName).toBe('username')
      } else {
        assert.fail('Expected UNIQUE constraint with columnName property')
      }
    })

    it('should add a check constraint to a table', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'addConstraint',
              tableName: 'users',
              constraintName: 'username_length_check',
              constraint: {
                type: 'CHECK',
                name: 'username_length_check',
                detail: 'LENGTH(username) > 3',
              },
            },
          ],
        },
      }

      const { schema } = overrideSchema(originalSchema, override)

      // Constraint should be added
      expect(
        schema.tables['users']?.constraints['username_length_check'],
      ).toBeDefined()
      expect(
        schema.tables['users']?.constraints['username_length_check']?.type,
      ).toBe('CHECK')
      const checkConstraint =
        schema.tables['users']?.constraints['username_length_check']
      if (checkConstraint && checkConstraint.type === 'CHECK') {
        expect(checkConstraint.detail).toBe('LENGTH(username) > 3')
      } else {
        assert.fail('Expected CHECK constraint with detail property')
      }
    })

    it('should add a foreign key constraint if target table and column exist', () => {
      // We need a schema with multiple tables for this test
      const schemaWithMultipleTables: Schema = {
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
          operations: [
            {
              type: 'addConstraint',
              tableName: 'posts',
              constraintName: 'posts_user_fk',
              constraint: {
                type: 'FOREIGN KEY',
                name: 'posts_user_fk',
                columnName: 'user_id',
                targetTableName: 'users',
                targetColumnName: 'id',
                updateConstraint: 'CASCADE',
                deleteConstraint: 'CASCADE',
              },
            },
          ],
        },
      }

      const { schema } = overrideSchema(schemaWithMultipleTables, override)

      // Constraint should be added
      expect(schema.tables['posts']?.constraints['posts_user_fk']).toBeDefined()
      expect(schema.tables['posts']?.constraints['posts_user_fk']?.type).toBe(
        'FOREIGN KEY',
      )
      const fkConstraint = schema.tables['posts']?.constraints['posts_user_fk']
      if (fkConstraint && fkConstraint.type === 'FOREIGN KEY') {
        expect(fkConstraint.columnName).toBe('user_id')
        expect(fkConstraint.targetTableName).toBe('users')
        expect(fkConstraint.targetColumnName).toBe('id')
        expect(fkConstraint.updateConstraint).toBe('CASCADE')
        expect(fkConstraint.deleteConstraint).toBe('CASCADE')
      } else {
        assert.fail('Expected FOREIGN KEY constraint with proper properties')
      }
    })

    it('should throw an error when adding a constraint to a non-existent table', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'addConstraint',
              tableName: 'nonexistent',
              constraintName: 'test_pk',
              constraint: {
                type: 'PRIMARY KEY',
                name: 'test_pk',
                columnName: 'id',
              },
            },
          ],
        },
      }

      expect(() => overrideSchema(originalSchema, override)).toThrowError(
        'Cannot add constraint to non-existent table: nonexistent',
      )
    })

    it('should throw an error when adding a constraint that already exists', () => {
      // First, add a constraint
      const schemaWithConstraint = overrideSchema(originalSchema, {
        overrides: {
          operations: [
            {
              type: 'addConstraint',
              tableName: 'users',
              constraintName: 'users_pk',
              constraint: {
                type: 'PRIMARY KEY',
                name: 'users_pk',
                columnName: 'id',
              },
            },
          ],
        },
      }).schema

      // Then try to add it again
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'addConstraint',
              tableName: 'users',
              constraintName: 'users_pk',
              constraint: {
                type: 'PRIMARY KEY',
                name: 'users_pk',
                columnName: 'id',
              },
            },
          ],
        },
      }

      expect(() => overrideSchema(schemaWithConstraint, override)).toThrowError(
        'Constraint already exists: users_pk in table users',
      )
    })

    it('should throw an error when adding a constraint for a non-existent column', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'addConstraint',
              tableName: 'users',
              constraintName: 'users_nonexistent_unique',
              constraint: {
                type: 'UNIQUE',
                name: 'users_nonexistent_unique',
                columnName: 'nonexistent',
              },
            },
          ],
        },
      }

      expect(() => overrideSchema(originalSchema, override)).toThrowError(
        'Cannot create constraint for non-existent column: nonexistent in table users',
      )
    })

    it('should throw an error when adding a foreign key with non-existent target table', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'addConstraint',
              tableName: 'users',
              constraintName: 'users_fk',
              constraint: {
                type: 'FOREIGN KEY',
                name: 'users_fk',
                columnName: 'id',
                targetTableName: 'nonexistent',
                targetColumnName: 'id',
                updateConstraint: 'CASCADE',
                deleteConstraint: 'CASCADE',
              },
            },
          ],
        },
      }

      expect(() => overrideSchema(originalSchema, override)).toThrowError(
        'Foreign key target table does not exist: nonexistent',
      )
    })

    it('should throw an error when adding a foreign key with non-existent target column', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'addConstraint',
              tableName: 'users',
              constraintName: 'users_fk',
              constraint: {
                type: 'FOREIGN KEY',
                name: 'users_fk',
                columnName: 'id',
                targetTableName: 'users',
                targetColumnName: 'nonexistent',
                updateConstraint: 'CASCADE',
                deleteConstraint: 'CASCADE',
              },
            },
          ],
        },
      }

      expect(() => overrideSchema(originalSchema, override)).toThrowError(
        'Foreign key target column does not exist: nonexistent in table users',
      )
    })
  })

  describe('Operation: deleteConstraint', () => {
    it('should delete an existing constraint from a table', () => {
      // First, add a constraint
      const schemaWithConstraint = overrideSchema(originalSchema, {
        overrides: {
          operations: [
            {
              type: 'addConstraint',
              tableName: 'users',
              constraintName: 'users_pk',
              constraint: {
                type: 'PRIMARY KEY',
                name: 'users_pk',
                columnName: 'id',
              },
            },
          ],
        },
      }).schema

      // Then delete it
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'deleteConstraint',
              tableName: 'users',
              constraintName: 'users_pk',
            },
          ],
        },
      }

      const { schema } = overrideSchema(schemaWithConstraint, override)

      // Constraint should be deleted
      expect(schema.tables['users']?.constraints['users_pk']).toBeUndefined()
    })

    it('should throw an error when deleting a constraint from a non-existent table', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'deleteConstraint',
              tableName: 'nonexistent',
              constraintName: 'test_pk',
            },
          ],
        },
      }

      expect(() => overrideSchema(originalSchema, override)).toThrowError(
        'Cannot delete constraint from non-existent table: nonexistent',
      )
    })

    it('should throw an error when deleting a non-existent constraint', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'deleteConstraint',
              tableName: 'users',
              constraintName: 'nonexistent_constraint',
            },
          ],
        },
      }

      expect(() => overrideSchema(originalSchema, override)).toThrowError(
        'Cannot delete non-existent constraint: nonexistent_constraint from table users',
      )
    })
  })

  describe('Operation: addRelationship', () => {
    it('should add a new relationship between tables', () => {
      // We need a schema with multiple tables for this test
      const schemaWithMultipleTables: Schema = {
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
          operations: [
            {
              type: 'addRelationship',
              relationshipName: 'posts_users',
              relationship: {
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
          ],
        },
      }

      const { schema } = overrideSchema(schemaWithMultipleTables, override)

      // Relationship should be added
      expect(schema.relationships['posts_users']).toBeDefined()
      const relationship = schema.relationships['posts_users']
      if (relationship) {
        expect(relationship.primaryTableName).toBe('users')
        expect(relationship.primaryColumnName).toBe('id')
        expect(relationship.foreignTableName).toBe('posts')
        expect(relationship.foreignColumnName).toBe('user_id')
        expect(relationship.cardinality).toBe('ONE_TO_MANY')
        expect(relationship.updateConstraint).toBe('CASCADE')
        expect(relationship.deleteConstraint).toBe('CASCADE')
      } else {
        assert.fail('Expected relationship to be defined')
      }
    })

    it('should throw an error when adding a relationship that already exists', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'addRelationship',
              relationshipName: 'posts_users', // Already exists in schemaWithRelationships
              relationship: {
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
          ],
        },
      }

      expect(() =>
        overrideSchema(schemaWithRelationships, override),
      ).toThrowError('Relationship already exists: posts_users')
    })

    it('should throw an error when adding a relationship with non-existent primary table', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'addRelationship',
              relationshipName: 'test_relationship',
              relationship: {
                name: 'test_relationship',
                primaryTableName: 'nonexistent',
                primaryColumnName: 'id',
                foreignTableName: 'users',
                foreignColumnName: 'id',
                cardinality: 'ONE_TO_ONE',
                updateConstraint: 'CASCADE',
                deleteConstraint: 'CASCADE',
              },
            },
          ],
        },
      }

      expect(() => overrideSchema(originalSchema, override)).toThrowError(
        'Primary table does not exist: nonexistent',
      )
    })

    it('should throw an error when adding a relationship with non-existent foreign table', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'addRelationship',
              relationshipName: 'test_relationship',
              relationship: {
                name: 'test_relationship',
                primaryTableName: 'users',
                primaryColumnName: 'id',
                foreignTableName: 'nonexistent',
                foreignColumnName: 'id',
                cardinality: 'ONE_TO_ONE',
                updateConstraint: 'CASCADE',
                deleteConstraint: 'CASCADE',
              },
            },
          ],
        },
      }

      expect(() => overrideSchema(originalSchema, override)).toThrowError(
        'Foreign table does not exist: nonexistent',
      )
    })

    it('should throw an error when adding a relationship with non-existent primary column', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'addRelationship',
              relationshipName: 'test_relationship',
              relationship: {
                name: 'test_relationship',
                primaryTableName: 'users',
                primaryColumnName: 'nonexistent',
                foreignTableName: 'users',
                foreignColumnName: 'id',
                cardinality: 'ONE_TO_ONE',
                updateConstraint: 'CASCADE',
                deleteConstraint: 'CASCADE',
              },
            },
          ],
        },
      }

      expect(() => overrideSchema(originalSchema, override)).toThrowError(
        'Primary column does not exist: nonexistent in table users',
      )
    })

    it('should throw an error when adding a relationship with non-existent foreign column', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'addRelationship',
              relationshipName: 'test_relationship',
              relationship: {
                name: 'test_relationship',
                primaryTableName: 'users',
                primaryColumnName: 'id',
                foreignTableName: 'users',
                foreignColumnName: 'nonexistent',
                cardinality: 'ONE_TO_ONE',
                updateConstraint: 'CASCADE',
                deleteConstraint: 'CASCADE',
              },
            },
          ],
        },
      }

      expect(() => overrideSchema(originalSchema, override)).toThrowError(
        'Foreign column does not exist: nonexistent in table users',
      )
    })
  })

  describe('Operation: deleteRelationship', () => {
    it('should delete an existing relationship', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'deleteRelationship',
              relationshipName: 'posts_users',
            },
          ],
        },
      }

      const { schema } = overrideSchema(schemaWithRelationships, override)

      // Relationship should be deleted
      expect(schema.relationships['posts_users']).toBeUndefined()
    })

    it('should throw an error when deleting a non-existent relationship', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'deleteRelationship',
              relationshipName: 'nonexistent_relationship',
            },
          ],
        },
      }

      expect(() => overrideSchema(originalSchema, override)).toThrowError(
        'Cannot delete non-existent relationship: nonexistent_relationship',
      )
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
      expect(schema.tables['new_users']?.comment).toBe(
        'Replacement users table',
      )
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

  describe('Operation: changeTable', () => {
    it('should rename a table', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'changeTable',
              changeTable: {
                oldTableName: 'users',
                newTableName: 'accounts',
              },
            },
          ],
        },
      }

      const { schema } = overrideSchema(originalSchema, override)

      // Old table should be gone
      expect(schema.tables['users']).toBeUndefined()
      // New table should be present
      expect(schema.tables['accounts']).toBeDefined()
      expect(schema.tables['accounts']?.comment).toBe('User accounts')
      expect(schema.tables['accounts']?.columns['id']).toBeDefined()
      expect(schema.tables['accounts']?.columns['username']).toBeDefined()
    })

    it('should update relationships when renaming a table', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'changeTable',
              changeTable: {
                oldTableName: 'users',
                newTableName: 'accounts',
              },
            },
          ],
        },
      }

      const { schema } = overrideSchema(schemaWithRelationships, override)

      // Relationship should be updated with the new table name
      expect(schema.relationships['posts_users']).toBeDefined()
      expect(schema.relationships['posts_users']?.primaryTableName).toBe('accounts')
      expect(schema.relationships['posts_users']?.foreignTableName).toBe('posts')
    })

    it('should update table groups when renaming a table', () => {
      // Create a schema with a table group containing the users table
      const schemaWithTableGroup: Schema = {
        ...originalSchema,
        tableGroups: {
          auth: {
            name: 'Auth',
            tables: ['users'],
            comment: 'Authentication tables',
          },
        },
      }

      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'changeTable',
              changeTable: {
                oldTableName: 'users',
                newTableName: 'accounts',
              },
            },
          ],
        },
      }

      const { schema, tableGroups } = overrideSchema(schemaWithTableGroup, override)

      // Table group should reference the new table name
      expect(tableGroups['auth']).toBeDefined()
      expect(tableGroups['auth']?.tables).not.toContain('users')
      expect(tableGroups['auth']?.tables).toContain('accounts')
    })

    it('should throw an error when trying to rename a non-existent table', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'changeTable',
              changeTable: {
                oldTableName: 'nonexistent',
                newTableName: 'accounts',
              },
            },
          ],
        },
      }

      expect(() => overrideSchema(originalSchema, override)).toThrowError(
        'Cannot rename non-existent table: nonexistent',
      )
    })

    it('should throw an error when trying to rename to an existing table', () => {
      const schemaWithTwoTables: Schema = {
        tables: {
          ...originalSchema.tables,
          posts: {
            name: 'posts',
            comment: 'Blog posts',
            columns: {},
            indexes: {},
            constraints: {},
          },
        },
        relationships: {},
        tableGroups: {},
      }

      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'changeTable',
              changeTable: {
                oldTableName: 'users',
                newTableName: 'posts',
              },
            },
          ],
        },
      }

      expect(() => overrideSchema(schemaWithTwoTables, override)).toThrowError(
        'Cannot rename to existing table: posts',
      )
    })
  })

  describe('Operation: changeColumn', () => {
    it('should rename a column', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'changeColumn',
              changeColumn: {
                tableName: 'users',
                oldColumnName: 'username',
                newColumnName: 'login',
              },
            },
          ],
        },
      }

      const { schema } = overrideSchema(originalSchema, override)

      // Old column should be gone
      expect(schema.tables['users']?.columns['username']).toBeUndefined()
      // New column should be present
      expect(schema.tables['users']?.columns['login']).toBeDefined()
      expect(schema.tables['users']?.columns['login']?.type).toBe('varchar')
      expect(schema.tables['users']?.columns['login']?.comment).toBe('Unique username')
    })

    it('should update relationships when renaming a column', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'changeColumn',
              changeColumn: {
                tableName: 'posts',
                oldColumnName: 'user_id',
                newColumnName: 'author_id',
              },
            },
          ],
        },
      }

      const { schema } = overrideSchema(schemaWithRelationships, override)

      // Relationship should be updated with the new column name
      expect(schema.relationships['posts_users']).toBeDefined()
      expect(schema.relationships['posts_users']?.primaryTableName).toBe('users')
      expect(schema.relationships['posts_users']?.primaryColumnName).toBe('id')
      expect(schema.relationships['posts_users']?.foreignTableName).toBe('posts')
      expect(schema.relationships['posts_users']?.foreignColumnName).toBe('author_id')
    })

    it('should update indexes when renaming a column', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'changeColumn',
              changeColumn: {
                tableName: 'users',
                oldColumnName: 'username',
                newColumnName: 'login',
              },
            },
          ],
        },
      }

      const { schema } = overrideSchema(originalSchema, override)

      // Index should be updated with the new column name
      expect(schema.tables['users']?.indexes['users_username_idx']).toBeDefined()
      expect(schema.tables['users']?.indexes['users_username_idx']?.columns).toContain('login')
      expect(schema.tables['users']?.indexes['users_username_idx']?.columns).not.toContain('username')
    })

    it('should throw an error when trying to rename a column in a non-existent table', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'changeColumn',
              changeColumn: {
                tableName: 'nonexistent',
                oldColumnName: 'username',
                newColumnName: 'login',
              },
            },
          ],
        },
      }

      expect(() => overrideSchema(originalSchema, override)).toThrowError(
        'Cannot rename column in non-existent table: nonexistent',
      )
    })

    it('should throw an error when trying to rename a non-existent column', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'changeColumn',
              changeColumn: {
                tableName: 'users',
                oldColumnName: 'nonexistent',
                newColumnName: 'login',
              },
            },
          ],
        },
      }

      expect(() => overrideSchema(originalSchema, override)).toThrowError(
        'Cannot rename non-existent column: nonexistent in table users',
      )
    })

    it('should throw an error when trying to rename to an existing column', () => {
      const override: SchemaOverride = {
        overrides: {
          operations: [
            {
              type: 'changeColumn',
              changeColumn: {
                tableName: 'users',
                oldColumnName: 'username',
                newColumnName: 'id',
              },
            },
          ],
        },
      }

      expect(() => overrideSchema(originalSchema, override)).toThrowError(
        'Cannot rename to existing column: id in table users',
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
