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
            columnNames: ['user_id'],
            targetTableName: 'users',
            targetColumnNames: ['id'],
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
            columnNames: ['user_id'],
            targetTableName: 'users',
            targetColumnNames: ['id'],
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
            columnNames: ['user_id'],
            targetTableName: 'users',
            targetColumnNames: ['id'],
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
            columnNames: ['user_id'],
            targetTableName: 'users',
            targetColumnNames: ['id'],
            updateConstraint: 'CASCADE',
            deleteConstraint: 'CASCADE',
          },
          fk_posts_category: {
            type: 'FOREIGN KEY',
            name: 'fk_posts_category',
            columnNames: ['category_id'],
            targetTableName: 'categories',
            targetColumnNames: ['id'],
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

  it('should handle composite foreign keys by creating multiple relationships', () => {
    const tables = {
      regions: aTable({
        name: 'regions',
        columns: {
          country_code: aColumn({
            name: 'country_code',
            type: 'varchar',
            notNull: true,
          }),
          region_code: aColumn({
            name: 'region_code',
            type: 'varchar',
            notNull: true,
          }),
        },
        constraints: {
          pk_regions: {
            type: 'PRIMARY KEY',
            name: 'pk_regions',
            columnNames: ['country_code', 'region_code'],
          },
        },
      }),
      stores: aTable({
        name: 'stores',
        columns: {
          id: aColumn({
            name: 'id',
            type: 'bigint',
            notNull: true,
          }),
          country_code: aColumn({
            name: 'country_code',
            type: 'varchar',
            notNull: true,
          }),
          region_code: aColumn({
            name: 'region_code',
            type: 'varchar',
            notNull: true,
          }),
        },
        constraints: {
          fk_stores_region: {
            type: 'FOREIGN KEY',
            name: 'fk_stores_region',
            columnNames: ['country_code', 'region_code'],
            targetTableName: 'regions',
            targetColumnNames: ['country_code', 'region_code'],
            updateConstraint: 'CASCADE',
            deleteConstraint: 'CASCADE',
          },
        },
      }),
    }

    const result = constraintsToRelationships(tables)

    expect(Object.keys(result)).toHaveLength(2)
    expect(result['fk_stores_region_0']).toEqual({
      name: 'fk_stores_region_0',
      primaryTableName: 'regions',
      primaryColumnName: 'country_code',
      foreignTableName: 'stores',
      foreignColumnName: 'country_code',
      cardinality: 'ONE_TO_MANY',
      updateConstraint: 'CASCADE',
      deleteConstraint: 'CASCADE',
    })
    expect(result['fk_stores_region_1']).toEqual({
      name: 'fk_stores_region_1',
      primaryTableName: 'regions',
      primaryColumnName: 'region_code',
      foreignTableName: 'stores',
      foreignColumnName: 'region_code',
      cardinality: 'ONE_TO_MANY',
      updateConstraint: 'CASCADE',
      deleteConstraint: 'CASCADE',
    })
  })

  it('should detect ONE_TO_ONE for composite foreign keys with matching UNIQUE constraint', () => {
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
        },
      }),
      user_profiles: aTable({
        name: 'user_profiles',
        columns: {
          user_id: aColumn({
            name: 'user_id',
            type: 'bigint',
            notNull: true,
          }),
          profile_type: aColumn({
            name: 'profile_type',
            type: 'varchar',
            notNull: true,
          }),
          bio: aColumn({
            name: 'bio',
            type: 'text',
            notNull: false,
          }),
        },
        constraints: {
          fk_profiles_user: {
            type: 'FOREIGN KEY',
            name: 'fk_profiles_user',
            columnNames: ['user_id', 'profile_type'],
            targetTableName: 'users',
            targetColumnNames: ['id', 'email'],
            updateConstraint: 'CASCADE',
            deleteConstraint: 'CASCADE',
          },
          uk_user_profile: {
            type: 'UNIQUE',
            name: 'uk_user_profile',
            columnNames: ['user_id', 'profile_type'],
          },
        },
      }),
    }

    const result = constraintsToRelationships(tables)

    expect(result['fk_profiles_user_0']?.cardinality).toBe('ONE_TO_ONE')
    expect(result['fk_profiles_user_1']?.cardinality).toBe('ONE_TO_ONE')
  })
})
