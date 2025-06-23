import { describe, expect, it } from 'vitest'
import type { Tables } from '@liam-hq/db-structure'
import { constraintsToRelationships } from './constraintsToRelationships'

describe('constraintsToRelationships', () => {
  it('should return empty array when no tables are provided', () => {
    const tables: Tables = {}
    const result = constraintsToRelationships(tables)
    expect(result).toEqual([])
  })

  it('should return empty array when tables have no foreign key constraints', () => {
    const tables: Tables = {
      users: {
        name: 'users',
        columns: {
          id: {
            name: 'id',
            type: 'integer',
            primary: true,
            unique: false,
            notNull: true,
            default: null,
            check: null,
            comment: null,
          },
        },
        comment: null,
        indexes: {},
        constraints: {
          users_pkey: {
            type: 'PRIMARY KEY',
            name: 'users_pkey',
            columnName: 'id',
          },
        },
      },
    }

    const result = constraintsToRelationships(tables)
    expect(result).toEqual([])
  })

  it('should create ONE_TO_MANY relationship for standard foreign key', () => {
    const tables: Tables = {
      users: {
        name: 'users',
        columns: {
          id: {
            name: 'id',
            type: 'integer',
            primary: true,
            unique: false,
            notNull: true,
            default: null,
            check: null,
            comment: null,
          },
        },
        comment: null,
        indexes: {},
        constraints: {
          users_pkey: {
            type: 'PRIMARY KEY',
            name: 'users_pkey',
            columnName: 'id',
          },
        },
      },
      posts: {
        name: 'posts',
        columns: {
          id: {
            name: 'id',
            type: 'integer',
            primary: true,
            unique: false,
            notNull: true,
            default: null,
            check: null,
            comment: null,
          },
          user_id: {
            name: 'user_id',
            type: 'integer',
            primary: false,
            unique: false,
            notNull: true,
            default: null,
            check: null,
            comment: null,
          },
        },
        comment: null,
        indexes: {},
        constraints: {
          posts_pkey: {
            type: 'PRIMARY KEY',
            name: 'posts_pkey',
            columnName: 'id',
          },
          posts_user_id_fkey: {
            type: 'FOREIGN KEY',
            name: 'posts_user_id_fkey',
            columnName: 'user_id',
            targetTableName: 'users',
            targetColumnName: 'id',
            updateConstraint: 'NO_ACTION',
            deleteConstraint: 'NO_ACTION',
          },
        },
      },
    }

    const result = constraintsToRelationships(tables)
    expect(result).toEqual([
      {
        name: 'posts_user_id_fkey',
        primaryTableName: 'users',
        primaryColumnName: 'id',
        foreignTableName: 'posts',
        foreignColumnName: 'user_id',
        cardinality: 'ONE_TO_MANY',
      },
    ])
  })

  it('should create ONE_TO_ONE relationship when foreign key column is primary key', () => {
    const tables: Tables = {
      users: {
        name: 'users',
        columns: {
          id: {
            name: 'id',
            type: 'integer',
            primary: true,
            unique: false,
            notNull: true,
            default: null,
            check: null,
            comment: null,
          },
        },
        comment: null,
        indexes: {},
        constraints: {
          users_pkey: {
            type: 'PRIMARY KEY',
            name: 'users_pkey',
            columnName: 'id',
          },
        },
      },
      profiles: {
        name: 'profiles',
        columns: {
          user_id: {
            name: 'user_id',
            type: 'integer',
            primary: true,
            unique: false,
            notNull: true,
            default: null,
            check: null,
            comment: null,
          },
        },
        comment: null,
        indexes: {},
        constraints: {
          profiles_pkey: {
            type: 'PRIMARY KEY',
            name: 'profiles_pkey',
            columnName: 'user_id',
          },
          profiles_user_id_fkey: {
            type: 'FOREIGN KEY',
            name: 'profiles_user_id_fkey',
            columnName: 'user_id',
            targetTableName: 'users',
            targetColumnName: 'id',
            updateConstraint: 'NO_ACTION',
            deleteConstraint: 'NO_ACTION',
          },
        },
      },
    }

    const result = constraintsToRelationships(tables)
    expect(result).toEqual([
      {
        name: 'profiles_user_id_fkey',
        primaryTableName: 'users',
        primaryColumnName: 'id',
        foreignTableName: 'profiles',
        foreignColumnName: 'user_id',
        cardinality: 'ONE_TO_ONE',
      },
    ])
  })

  it('should create ONE_TO_ONE relationship when foreign key column has unique constraint', () => {
    const tables: Tables = {
      users: {
        name: 'users',
        columns: {
          id: {
            name: 'id',
            type: 'integer',
            primary: true,
            unique: false,
            notNull: true,
            default: null,
            check: null,
            comment: null,
          },
        },
        comment: null,
        indexes: {},
        constraints: {
          users_pkey: {
            type: 'PRIMARY KEY',
            name: 'users_pkey',
            columnName: 'id',
          },
        },
      },
      profiles: {
        name: 'profiles',
        columns: {
          id: {
            name: 'id',
            type: 'integer',
            primary: true,
            unique: false,
            notNull: true,
            default: null,
            check: null,
            comment: null,
          },
          user_id: {
            name: 'user_id',
            type: 'integer',
            primary: false,
            unique: false,
            notNull: true,
            default: null,
            check: null,
            comment: null,
          },
        },
        comment: null,
        indexes: {},
        constraints: {
          profiles_pkey: {
            type: 'PRIMARY KEY',
            name: 'profiles_pkey',
            columnName: 'id',
          },
          profiles_user_id_unique: {
            type: 'UNIQUE',
            name: 'profiles_user_id_unique',
            columnName: 'user_id',
          },
          profiles_user_id_fkey: {
            type: 'FOREIGN KEY',
            name: 'profiles_user_id_fkey',
            columnName: 'user_id',
            targetTableName: 'users',
            targetColumnName: 'id',
            updateConstraint: 'NO_ACTION',
            deleteConstraint: 'NO_ACTION',
          },
        },
      },
    }

    const result = constraintsToRelationships(tables)
    expect(result).toEqual([
      {
        name: 'profiles_user_id_fkey',
        primaryTableName: 'users',
        primaryColumnName: 'id',
        foreignTableName: 'profiles',
        foreignColumnName: 'user_id',
        cardinality: 'ONE_TO_ONE',
      },
    ])
  })

  it('should create ONE_TO_ONE relationship when foreign key column has unique: true', () => {
    const tables: Tables = {
      users: {
        name: 'users',
        columns: {
          id: {
            name: 'id',
            type: 'integer',
            primary: true,
            unique: false,
            notNull: true,
            default: null,
            check: null,
            comment: null,
          },
        },
        comment: null,
        indexes: {},
        constraints: {
          users_pkey: {
            type: 'PRIMARY KEY',
            name: 'users_pkey',
            columnName: 'id',
          },
        },
      },
      profiles: {
        name: 'profiles',
        columns: {
          id: {
            name: 'id',
            type: 'integer',
            primary: true,
            unique: false,
            notNull: true,
            default: null,
            check: null,
            comment: null,
          },
          user_id: {
            name: 'user_id',
            type: 'integer',
            primary: false,
            unique: true, // Column level unique
            notNull: true,
            default: null,
            check: null,
            comment: null,
          },
        },
        comment: null,
        indexes: {},
        constraints: {
          profiles_pkey: {
            type: 'PRIMARY KEY',
            name: 'profiles_pkey',
            columnName: 'id',
          },
          profiles_user_id_fkey: {
            type: 'FOREIGN KEY',
            name: 'profiles_user_id_fkey',
            columnName: 'user_id',
            targetTableName: 'users',
            targetColumnName: 'id',
            updateConstraint: 'NO_ACTION',
            deleteConstraint: 'NO_ACTION',
          },
        },
      },
    }

    const result = constraintsToRelationships(tables)
    expect(result).toEqual([
      {
        name: 'profiles_user_id_fkey',
        primaryTableName: 'users',
        primaryColumnName: 'id',
        foreignTableName: 'profiles',
        foreignColumnName: 'user_id',
        cardinality: 'ONE_TO_ONE',
      },
    ])
  })

  it('should handle multiple foreign key constraints in one table', () => {
    const tables: Tables = {
      users: {
        name: 'users',
        columns: {
          id: {
            name: 'id',
            type: 'integer',
            primary: true,
            unique: false,
            notNull: true,
            default: null,
            check: null,
            comment: null,
          },
        },
        comment: null,
        indexes: {},
        constraints: {
          users_pkey: {
            type: 'PRIMARY KEY',
            name: 'users_pkey',
            columnName: 'id',
          },
        },
      },
      categories: {
        name: 'categories',
        columns: {
          id: {
            name: 'id',
            type: 'integer',
            primary: true,
            unique: false,
            notNull: true,
            default: null,
            check: null,
            comment: null,
          },
        },
        comment: null,
        indexes: {},
        constraints: {
          categories_pkey: {
            type: 'PRIMARY KEY',
            name: 'categories_pkey',
            columnName: 'id',
          },
        },
      },
      posts: {
        name: 'posts',
        columns: {
          id: {
            name: 'id',
            type: 'integer',
            primary: true,
            unique: false,
            notNull: true,
            default: null,
            check: null,
            comment: null,
          },
          user_id: {
            name: 'user_id',
            type: 'integer',
            primary: false,
            unique: false,
            notNull: true,
            default: null,
            check: null,
            comment: null,
          },
          category_id: {
            name: 'category_id',
            type: 'integer',
            primary: false,
            unique: false,
            notNull: true,
            default: null,
            check: null,
            comment: null,
          },
        },
        comment: null,
        indexes: {},
        constraints: {
          posts_pkey: {
            type: 'PRIMARY KEY',
            name: 'posts_pkey',
            columnName: 'id',
          },
          posts_user_id_fkey: {
            type: 'FOREIGN KEY',
            name: 'posts_user_id_fkey',
            columnName: 'user_id',
            targetTableName: 'users',
            targetColumnName: 'id',
            updateConstraint: 'NO_ACTION',
            deleteConstraint: 'NO_ACTION',
          },
          posts_category_id_fkey: {
            type: 'FOREIGN KEY',
            name: 'posts_category_id_fkey',
            columnName: 'category_id',
            targetTableName: 'categories',
            targetColumnName: 'id',
            updateConstraint: 'CASCADE',
            deleteConstraint: 'SET_NULL',
          },
        },
      },
    }

    const result = constraintsToRelationships(tables)
    expect(result).toHaveLength(2)
    expect(result).toContainEqual({
      name: 'posts_user_id_fkey',
      primaryTableName: 'users',
      primaryColumnName: 'id',
      foreignTableName: 'posts',
      foreignColumnName: 'user_id',
      cardinality: 'ONE_TO_MANY',
    })
    expect(result).toContainEqual({
      name: 'posts_category_id_fkey',
      primaryTableName: 'categories',
      primaryColumnName: 'id',
      foreignTableName: 'posts',
      foreignColumnName: 'category_id',
      cardinality: 'ONE_TO_MANY',
    })
  })

  it('should return ONE_TO_MANY when target table does not exist', () => {
    const tables: Tables = {
      posts: {
        name: 'posts',
        columns: {
          id: {
            name: 'id',
            type: 'integer',
            primary: true,
            unique: false,
            notNull: true,
            default: null,
            check: null,
            comment: null,
          },
          user_id: {
            name: 'user_id',
            type: 'integer',
            primary: false,
            unique: false,
            notNull: true,
            default: null,
            check: null,
            comment: null,
          },
        },
        comment: null,
        indexes: {},
        constraints: {
          posts_pkey: {
            type: 'PRIMARY KEY',
            name: 'posts_pkey',
            columnName: 'id',
          },
          posts_user_id_fkey: {
            type: 'FOREIGN KEY',
            name: 'posts_user_id_fkey',
            columnName: 'user_id',
            targetTableName: 'users', // This table doesn't exist
            targetColumnName: 'id',
            updateConstraint: 'NO_ACTION',
            deleteConstraint: 'NO_ACTION',
          },
        },
      },
    }

    const result = constraintsToRelationships(tables)
    expect(result).toEqual([
      {
        name: 'posts_user_id_fkey',
        primaryTableName: 'users',
        primaryColumnName: 'id',
        foreignTableName: 'posts',
        foreignColumnName: 'user_id',
        cardinality: 'ONE_TO_MANY',
      },
    ])
  })

  it('should return ONE_TO_MANY when foreign key column does not exist', () => {
    const tables: Tables = {
      users: {
        name: 'users',
        columns: {
          id: {
            name: 'id',
            type: 'integer',
            primary: true,
            unique: false,
            notNull: true,
            default: null,
            check: null,
            comment: null,
          },
        },
        comment: null,
        indexes: {},
        constraints: {
          users_pkey: {
            type: 'PRIMARY KEY',
            name: 'users_pkey',
            columnName: 'id',
          },
        },
      },
      posts: {
        name: 'posts',
        columns: {
          id: {
            name: 'id',
            type: 'integer',
            primary: true,
            unique: false,
            notNull: true,
            default: null,
            check: null,
            comment: null,
          },
          // user_id column doesn't exist
        },
        comment: null,
        indexes: {},
        constraints: {
          posts_pkey: {
            type: 'PRIMARY KEY',
            name: 'posts_pkey',
            columnName: 'id',
          },
          posts_user_id_fkey: {
            type: 'FOREIGN KEY',
            name: 'posts_user_id_fkey',
            columnName: 'user_id', // This column doesn't exist
            targetTableName: 'users',
            targetColumnName: 'id',
            updateConstraint: 'NO_ACTION',
            deleteConstraint: 'NO_ACTION',
          },
        },
      },
    }

    const result = constraintsToRelationships(tables)
    expect(result).toEqual([
      {
        name: 'posts_user_id_fkey',
        primaryTableName: 'users',
        primaryColumnName: 'id',
        foreignTableName: 'posts',
        foreignColumnName: 'user_id',
        cardinality: 'ONE_TO_MANY',
      },
    ])
  })

  it('should ignore non-foreign key constraints', () => {
    const tables: Tables = {
      users: {
        name: 'users',
        columns: {
          id: {
            name: 'id',
            type: 'integer',
            primary: true,
            unique: false,
            notNull: true,
            default: null,
            check: null,
            comment: null,
          },
          email: {
            name: 'email',
            type: 'varchar',
            primary: false,
            unique: false,
            notNull: true,
            default: null,
            check: null,
            comment: null,
          },
        },
        comment: null,
        indexes: {},
        constraints: {
          users_pkey: {
            type: 'PRIMARY KEY',
            name: 'users_pkey',
            columnName: 'id',
          },
          users_email_unique: {
            type: 'UNIQUE',
            name: 'users_email_unique',
            columnName: 'email',
          },
          users_email_check: {
            type: 'CHECK',
            name: 'users_email_check',
            detail: "email ~ '^[^@]+@[^@]+\\.[^@]+$'",
          },
        },
      },
    }

    const result = constraintsToRelationships(tables)
    expect(result).toEqual([])
  })
})