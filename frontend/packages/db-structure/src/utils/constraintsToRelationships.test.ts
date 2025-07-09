import { describe, expect, it } from 'vitest'
import { aColumn, aTable } from '../schema/index.js'
import { constraintsToRelationships } from './constraintsToRelationships.js'

describe('constraintsToRelationships', () => {
  it('should convert foreign key constraints to relationships', () => {
    const tables = {
      users: aTable({
        name: 'users',
        columns: {
          id: aColumn({
            name: 'id',
            type: 'bigint',
            notNull: true,
          }),
          name: aColumn({
            name: 'name',
            type: 'varchar',
            notNull: true,
          }),
        },
      }),
      posts: aTable({
        name: 'posts',
        columns: {
          id: aColumn({
            name: 'id',
            type: 'bigint',
            notNull: true,
          }),
          user_id: aColumn({
            name: 'user_id',
            type: 'bigint',
            notNull: true,
          }),
        },
        constraints: {
          fk_posts_user: {
            type: 'FOREIGN KEY',
            name: 'fk_posts_user',
            columnName: 'user_id',
            targetTableName: 'users',
            targetColumnName: 'id',
            updateConstraint: 'CASCADE',
            deleteConstraint: 'CASCADE',
          },
        },
      }),
    }

    const result = constraintsToRelationships(tables)

    expect(result).toEqual({
      fk_posts_user: {
        name: 'fk_posts_user',
        primaryTableName: 'users',
        primaryColumnName: 'id',
        foreignTableName: 'posts',
        foreignColumnName: 'user_id',
        cardinality: 'ONE_TO_MANY',
        updateConstraint: 'CASCADE',
        deleteConstraint: 'CASCADE',
      },
    })
  })

  it('should detect ONE_TO_ONE relationship when foreign key column is unique', () => {
    const tables = {
      users: aTable({
        name: 'users',
        columns: {
          id: aColumn({
            name: 'id',
            type: 'bigint',
            notNull: true,
          }),
        },
      }),
      profiles: aTable({
        name: 'profiles',
        columns: {
          id: aColumn({
            name: 'id',
            type: 'bigint',
            notNull: true,
          }),
          user_id: aColumn({
            name: 'user_id',
            type: 'bigint',
            notNull: true,
          }),
        },
        constraints: {
          fk_profiles_user: {
            type: 'FOREIGN KEY',
            name: 'fk_profiles_user',
            columnName: 'user_id',
            targetTableName: 'users',
            targetColumnName: 'id',
            updateConstraint: 'CASCADE',
            deleteConstraint: 'CASCADE',
          },
          uk_user_id: {
            type: 'UNIQUE',
            name: 'uk_user_id',
            columnNames: ['user_id'],
          },
        },
      }),
    }

    const result = constraintsToRelationships(tables)

    expect(result['fk_profiles_user']?.cardinality).toBe('ONE_TO_ONE')
  })

  it('should detect ONE_TO_ONE relationship when column has UNIQUE constraint', () => {
    const tables = {
      users: aTable({
        name: 'users',
        columns: {
          id: aColumn({
            name: 'id',
            type: 'bigint',
            notNull: true,
          }),
        },
      }),
      profiles: aTable({
        name: 'profiles',
        columns: {
          id: aColumn({
            name: 'id',
            type: 'bigint',
            notNull: true,
          }),
          user_id: aColumn({
            name: 'user_id',
            type: 'bigint',
            notNull: true,
          }),
        },
        constraints: {
          fk_profiles_user: {
            type: 'FOREIGN KEY',
            name: 'fk_profiles_user',
            columnName: 'user_id',
            targetTableName: 'users',
            targetColumnName: 'id',
            updateConstraint: 'CASCADE',
            deleteConstraint: 'CASCADE',
          },
          uk_user_id: {
            type: 'UNIQUE',
            name: 'uk_user_id',
            columnNames: ['user_id'],
          },
        },
      }),
    }

    const result = constraintsToRelationships(tables)

    expect(result['fk_profiles_user']?.cardinality).toBe('ONE_TO_ONE')
  })

  it('should handle multiple foreign key constraints', () => {
    const tables = {
      users: aTable({
        name: 'users',
        columns: {
          id: aColumn({
            name: 'id',
            type: 'bigint',
            notNull: true,
          }),
        },
      }),
      categories: aTable({
        name: 'categories',
        columns: {
          id: aColumn({
            name: 'id',
            type: 'bigint',
            notNull: true,
          }),
        },
      }),
      posts: aTable({
        name: 'posts',
        columns: {
          id: aColumn({
            name: 'id',
            type: 'bigint',
            notNull: true,
          }),
          user_id: aColumn({
            name: 'user_id',
            type: 'bigint',
            notNull: true,
          }),
          category_id: aColumn({
            name: 'category_id',
            type: 'bigint',
            notNull: true,
          }),
        },
        constraints: {
          fk_posts_user: {
            type: 'FOREIGN KEY',
            name: 'fk_posts_user',
            columnName: 'user_id',
            targetTableName: 'users',
            targetColumnName: 'id',
            updateConstraint: 'CASCADE',
            deleteConstraint: 'CASCADE',
          },
          fk_posts_category: {
            type: 'FOREIGN KEY',
            name: 'fk_posts_category',
            columnName: 'category_id',
            targetTableName: 'categories',
            targetColumnName: 'id',
            updateConstraint: 'CASCADE',
            deleteConstraint: 'SET_NULL',
          },
        },
      }),
    }

    const result = constraintsToRelationships(tables)

    expect(Object.keys(result)).toHaveLength(2)
    expect(result['fk_posts_user']).toBeDefined()
    expect(result['fk_posts_category']).toBeDefined()
    expect(result['fk_posts_category']?.deleteConstraint).toBe('SET_NULL')
  })

  it('should ignore non-foreign key constraints', () => {
    const tables = {
      users: aTable({
        name: 'users',
        columns: {
          id: aColumn({
            name: 'id',
            type: 'bigint',
            notNull: true,
          }),
          email: aColumn({
            name: 'email',
            type: 'varchar',
            notNull: true,
          }),
          age: aColumn({
            name: 'age',
            type: 'integer',
            notNull: true,
          }),
        },
        constraints: {
          pk_users: {
            type: 'PRIMARY KEY',
            name: 'pk_users',
            columnNames: ['id'],
          },
          uk_email: {
            type: 'UNIQUE',
            name: 'uk_email',
            columnNames: ['email'],
          },
          chk_age: {
            type: 'CHECK',
            name: 'chk_age',
            detail: 'age >= 0',
          },
        },
      }),
    }

    const result = constraintsToRelationships(tables)

    expect(result).toEqual({})
  })
})
