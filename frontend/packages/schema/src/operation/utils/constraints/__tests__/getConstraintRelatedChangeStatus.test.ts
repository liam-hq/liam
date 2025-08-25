import { describe, expect, it } from 'vitest'
import type { Operation } from '../../../schema/index.js'
import { getConstraintRelatedChangeStatus } from '../getConstraintRelatedChangeStatus.js'

// Mock constraint data for tests
const mockPrimaryKeyConstraint = {
  name: 'users_pkey',
  type: 'PRIMARY KEY' as const,
  columnNames: ['id'],
}

const mockForeignKeyConstraint = {
  name: 'fk_user_id',
  type: 'FOREIGN KEY' as const,
  columnNames: ['user_id'],
  targetTableName: 'users',
  targetColumnNames: ['id'],
  updateConstraint: 'CASCADE' as const,
  deleteConstraint: 'CASCADE' as const,
}

const mockUniqueConstraint = {
  name: 'unique_email',
  type: 'UNIQUE' as const,
  columnNames: ['email'],
}

describe('getConstraintRelatedChangeStatus', () => {
  it('should return "unchanged" when no operations match the table and constraint', () => {
    const operations: Operation[] = [
      {
        op: 'add',
        path: '/tables/other_table/constraints/pkey',
        value: mockPrimaryKeyConstraint,
      },
      { op: 'remove', path: '/tables/another_table/constraints/fkey' },
    ]
    const result = getConstraintRelatedChangeStatus({
      tableId: 'users',
      constraintId: 'users_pkey',
      operations,
    })
    expect(result).toBe('unchanged')
  })

  describe('constraint operations', () => {
    it('should return "added" when constraint is added', () => {
      const operations: Operation[] = [
        {
          op: 'add',
          path: '/tables/users/constraints/users_pkey',
          value: mockPrimaryKeyConstraint,
        },
      ]
      const result = getConstraintRelatedChangeStatus({
        tableId: 'users',
        constraintId: 'users_pkey',
        operations,
      })
      expect(result).toBe('added')
    })

    it('should return "removed" when constraint is removed', () => {
      const operations: Operation[] = [
        { op: 'remove', path: '/tables/users/constraints/users_pkey' },
      ]
      const result = getConstraintRelatedChangeStatus({
        tableId: 'users',
        constraintId: 'users_pkey',
        operations,
      })
      expect(result).toBe('removed')
    })

    it('should return "modified" when constraint name is changed', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users/constraints/users_pkey/name',
          value: 'pk_users',
        },
      ]
      const result = getConstraintRelatedChangeStatus({
        tableId: 'users',
        constraintId: 'users_pkey',
        operations,
      })
      expect(result).toBe('modified')
    })

    it('should return "modified" when constraint type is changed', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users/constraints/unique_email/type',
          value: 'UNIQUE',
        },
      ]
      const result = getConstraintRelatedChangeStatus({
        tableId: 'users',
        constraintId: 'unique_email',
        operations,
      })
      expect(result).toBe('modified')
    })
  })

  describe('foreign key constraint operations', () => {
    it('should return "modified" when update constraint is changed', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/orders/constraints/fk_user_id/updateConstraint',
          value: 'RESTRICT',
        },
      ]
      const result = getConstraintRelatedChangeStatus({
        tableId: 'orders',
        constraintId: 'fk_user_id',
        operations,
      })
      expect(result).toBe('modified')
    })

    it('should return "modified" when delete constraint is changed', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/orders/constraints/fk_user_id/deleteConstraint',
          value: 'SET NULL',
        },
      ]
      const result = getConstraintRelatedChangeStatus({
        tableId: 'orders',
        constraintId: 'fk_user_id',
        operations,
      })
      expect(result).toBe('modified')
    })
  })

  describe('check constraint operations', () => {
    it('should return "modified" when constraint detail is changed', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users/constraints/check_age/detail',
          value: 'age >= 21',
        },
      ]
      const result = getConstraintRelatedChangeStatus({
        tableId: 'users',
        constraintId: 'check_age',
        operations,
      })
      expect(result).toBe('modified')
    })
  })

  describe('multiple constraint operations', () => {
    it('should return "modified" when multiple properties are changed', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/orders/constraints/fk_user_id/targetTableName',
          value: 'customers',
        },
        {
          op: 'replace',
          path: '/tables/orders/constraints/fk_user_id/updateConstraint',
          value: 'RESTRICT',
        },
        {
          op: 'replace',
          path: '/tables/orders/constraints/fk_user_id/deleteConstraint',
          value: 'SET NULL',
        },
      ]
      const result = getConstraintRelatedChangeStatus({
        tableId: 'orders',
        constraintId: 'fk_user_id',
        operations,
      })
      expect(result).toBe('modified')
    })
  })

  describe('filtering operations', () => {
    it('should only consider operations for the specified table and constraint', () => {
      const operations: Operation[] = [
        {
          op: 'add',
          path: '/tables/users/constraints/users_pkey',
          value: mockPrimaryKeyConstraint,
        },
        {
          op: 'add',
          path: '/tables/users/constraints/unique_email',
          value: mockUniqueConstraint,
        },
        {
          op: 'add',
          path: '/tables/products/constraints/users_pkey',
          value: mockPrimaryKeyConstraint,
        },
      ]
      const result = getConstraintRelatedChangeStatus({
        tableId: 'users',
        constraintId: 'users_pkey',
        operations,
      })
      expect(result).toBe('added')
    })

    it('should ignore operations for other constraints in the same table', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users/constraints/unique_email/type',
          value: 'UNIQUE',
        },
        {
          op: 'replace',
          path: '/tables/users/constraints/check_age/detail',
          value: 'age >= 21',
        },
        {
          op: 'remove',
          path: '/tables/users/constraints/deprecated_constraint',
        },
      ]
      const result = getConstraintRelatedChangeStatus({
        tableId: 'users',
        constraintId: 'users_pkey',
        operations,
      })
      expect(result).toBe('unchanged')
    })

    it('should ignore non-constraint operations', () => {
      const operations: Operation[] = [
        {
          op: 'add',
          path: '/tables/users/columns/email',
          value: {
            name: 'email',
            type: 'varchar',
            default: null,
            check: null,
            notNull: false,
            comment: null,
          },
        },
        { op: 'remove', path: '/tables/users/indexes/idx_email' },
        { op: 'replace', path: '/tables/users/name', value: 'customers' },
      ]
      const result = getConstraintRelatedChangeStatus({
        tableId: 'users',
        constraintId: 'users_pkey',
        operations,
      })
      expect(result).toBe('unchanged')
    })
  })

  describe('mixed operations', () => {
    it('should handle mixed operations correctly', () => {
      const operations: Operation[] = [
        // Constraint operations for users.users_pkey
        {
          op: 'replace',
          path: '/tables/users/constraints/users_pkey/name',
          value: 'pk_users',
        },
        // Other constraint operations
        {
          op: 'add',
          path: '/tables/users/constraints/fk_user_id',
          value: mockForeignKeyConstraint,
        },
        // Other table constraint operations
        {
          op: 'replace',
          path: '/tables/products/constraints/users_pkey/name',
          value: 'pk_products',
        },
        // Non-constraint operations
        {
          op: 'add',
          path: '/tables/users/columns/email',
          value: {
            name: 'email',
            type: 'varchar',
            default: null,
            check: null,
            notNull: false,
            comment: null,
          },
        },
      ]
      const result = getConstraintRelatedChangeStatus({
        tableId: 'users',
        constraintId: 'users_pkey',
        operations,
      })
      expect(result).toBe('modified')
    })
  })

  describe('edge cases', () => {
    it('should handle constraint names with special characters', () => {
      const operations: Operation[] = [
        {
          op: 'add',
          path: '/tables/user_profile/constraints/user_profile_pkey',
          value: mockPrimaryKeyConstraint,
        },
      ]
      const result = getConstraintRelatedChangeStatus({
        tableId: 'user_profile',
        constraintId: 'user_profile_pkey',
        operations,
      })
      expect(result).toBe('added')
    })

    it('should handle empty operations array', () => {
      const result = getConstraintRelatedChangeStatus({
        tableId: 'users',
        constraintId: 'users_pkey',
        operations: [],
      })
      expect(result).toBe('unchanged')
    })

    it('should match exact table and constraint names only', () => {
      const operations: Operation[] = [
        {
          op: 'add',
          path: '/tables/users_old/constraints/users_pkey',
          value: mockPrimaryKeyConstraint,
        },
        {
          op: 'add',
          path: '/tables/users/constraints/users_pkey_old',
          value: mockPrimaryKeyConstraint,
        },
      ]
      const result = getConstraintRelatedChangeStatus({
        tableId: 'users',
        constraintId: 'users_pkey',
        operations,
      })
      expect(result).toBe('unchanged')
    })
  })

  describe('without constraintId', () => {
    it('should return "added" when any constraint is added to the table', () => {
      const operations: Operation[] = [
        {
          op: 'add',
          path: '/tables/users/constraints/users_pkey',
          value: mockPrimaryKeyConstraint,
        },
        {
          op: 'add',
          path: '/tables/users/constraints/unique_email',
          value: mockUniqueConstraint,
        },
      ]
      const result = getConstraintRelatedChangeStatus({
        tableId: 'users',
        operations,
      })
      expect(result).toBe('added')
    })

    it('should return "removed" when any constraint is removed from the table', () => {
      const operations: Operation[] = [
        { op: 'remove', path: '/tables/users/constraints/users_pkey' },
        { op: 'remove', path: '/tables/users/constraints/fk_user_id' },
      ]
      const result = getConstraintRelatedChangeStatus({
        tableId: 'users',
        operations,
      })
      expect(result).toBe('removed')
    })

    it('should return "modified" when any constraint is modified in the table', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users/constraints/users_pkey/name',
          value: 'pk_users',
        },
        {
          op: 'replace',
          path: '/tables/users/constraints/fk_user_id/updateConstraint',
          value: 'RESTRICT',
        },
      ]
      const result = getConstraintRelatedChangeStatus({
        tableId: 'users',
        operations,
      })
      expect(result).toBe('modified')
    })

    it('should return "unchanged" when no constraint operations exist for the table', () => {
      const operations: Operation[] = [
        {
          op: 'add',
          path: '/tables/products/constraints/products_pkey',
          value: mockPrimaryKeyConstraint,
        },
        {
          op: 'add',
          path: '/tables/users/columns/email',
          value: {
            name: 'email',
            type: 'varchar',
            default: null,
            check: null,
            notNull: false,
            comment: null,
          },
        },
      ]
      const result = getConstraintRelatedChangeStatus({
        tableId: 'users',
        operations,
      })
      expect(result).toBe('unchanged')
    })

    it('should return correct status for mixed constraint operations', () => {
      const operations: Operation[] = [
        {
          op: 'add',
          path: '/tables/users/constraints/check_age',
          value: {
            name: 'check_age',
            type: 'CHECK' as const,
            detail: 'age >= 18',
          },
        },
        {
          op: 'remove',
          path: '/tables/users/constraints/deprecated_constraint',
        },
        {
          op: 'replace',
          path: '/tables/users/constraints/fk_user_id/deleteConstraint',
          value: 'CASCADE',
        },
      ]
      const result = getConstraintRelatedChangeStatus({
        tableId: 'users',
        operations,
      })
      expect(result).toBe('modified')
    })
  })
})
