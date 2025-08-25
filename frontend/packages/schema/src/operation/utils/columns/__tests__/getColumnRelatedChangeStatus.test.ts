import { describe, expect, it } from 'vitest'
import type { Operation } from '../../../schema/index.js'
import { getColumnRelatedChangeStatus } from '../getColumnRelatedChangeStatus.js'

// Mock column data for tests
const mockColumn = {
  name: 'test_column',
  type: 'varchar',
  default: null,
  check: null,
  notNull: false,
  comment: null,
}

describe('getColumnRelatedChangeStatus', () => {
  it('should return "unchanged" when no operations match the table and column', () => {
    const operations: Operation[] = [
      { op: 'add', path: '/tables/other_table/columns/id', value: mockColumn },
      { op: 'remove', path: '/tables/users/columns/other_column' },
    ]
    const result = getColumnRelatedChangeStatus({
      tableId: 'users',
      columnId: 'email',
      operations,
    })
    expect(result).toBe('unchanged')
  })

  describe('column operations', () => {
    it('should return "added" when column is added', () => {
      const operations: Operation[] = [
        { op: 'add', path: '/tables/users/columns/email', value: mockColumn },
      ]
      const result = getColumnRelatedChangeStatus({
        tableId: 'users',
        columnId: 'email',
        operations,
      })
      expect(result).toBe('added')
    })

    it('should return "removed" when column is removed', () => {
      const operations: Operation[] = [
        { op: 'remove', path: '/tables/users/columns/email' },
      ]
      const result = getColumnRelatedChangeStatus({
        tableId: 'users',
        columnId: 'email',
        operations,
      })
      expect(result).toBe('removed')
    })

    it('should return "modified" when column name is changed', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users/columns/email/name',
          value: 'email_address',
        },
      ]
      const result = getColumnRelatedChangeStatus({
        tableId: 'users',
        columnId: 'email',
        operations,
      })
      expect(result).toBe('modified')
    })

    it('should return "modified" when column type is changed', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users/columns/email/type',
          value: 'text',
        },
      ]
      const result = getColumnRelatedChangeStatus({
        tableId: 'users',
        columnId: 'email',
        operations,
      })
      expect(result).toBe('modified')
    })

    it('should return "modified" when column comment is changed', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users/columns/email/comment',
          value: 'User email address',
        },
      ]
      const result = getColumnRelatedChangeStatus({
        tableId: 'users',
        columnId: 'email',
        operations,
      })
      expect(result).toBe('modified')
    })

    it('should return "modified" when column default is changed', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users/columns/status/default',
          value: 'active',
        },
      ]
      const result = getColumnRelatedChangeStatus({
        tableId: 'users',
        columnId: 'status',
        operations,
      })
      expect(result).toBe('modified')
    })

    it('should return "modified" when column check constraint is changed', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users/columns/age/check',
          value: 'age >= 18',
        },
      ]
      const result = getColumnRelatedChangeStatus({
        tableId: 'users',
        columnId: 'age',
        operations,
      })
      expect(result).toBe('modified')
    })

    it('should return "modified" when column notNull is changed', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users/columns/email/notNull',
          value: true,
        },
      ]
      const result = getColumnRelatedChangeStatus({
        tableId: 'users',
        columnId: 'email',
        operations,
      })
      expect(result).toBe('modified')
    })
  })

  describe('multiple column operations', () => {
    it('should return "modified" when multiple properties are changed', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users/columns/email/type',
          value: 'text',
        },
        {
          op: 'replace',
          path: '/tables/users/columns/email/notNull',
          value: true,
        },
        {
          op: 'replace',
          path: '/tables/users/columns/email/comment',
          value: 'Primary email',
        },
      ]
      const result = getColumnRelatedChangeStatus({
        tableId: 'users',
        columnId: 'email',
        operations,
      })
      expect(result).toBe('modified')
    })
  })

  describe('filtering operations', () => {
    it('should only consider operations for the specified table and column', () => {
      const operations: Operation[] = [
        { op: 'add', path: '/tables/users/columns/email', value: mockColumn },
        { op: 'add', path: '/tables/users/columns/name', value: mockColumn },
        {
          op: 'add',
          path: '/tables/products/columns/email',
          value: mockColumn,
        },
      ]
      const result = getColumnRelatedChangeStatus({
        tableId: 'users',
        columnId: 'email',
        operations,
      })
      expect(result).toBe('added')
    })

    it('should ignore operations for other columns in the same table', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users/columns/name/type',
          value: 'text',
        },
        {
          op: 'replace',
          path: '/tables/users/columns/age/type',
          value: 'bigint',
        },
        { op: 'remove', path: '/tables/users/columns/deprecated' },
      ]
      const result = getColumnRelatedChangeStatus({
        tableId: 'users',
        columnId: 'email',
        operations,
      })
      expect(result).toBe('unchanged')
    })

    it('should ignore non-column operations', () => {
      const operations: Operation[] = [
        {
          op: 'add',
          path: '/tables/users/indexes/idx_email',
          value: {
            name: 'idx_email',
            unique: false,
            columns: ['email'],
            type: 'btree',
          },
        },
        { op: 'remove', path: '/tables/users/constraints/users_pkey' },
        { op: 'replace', path: '/tables/users/name', value: 'customers' },
      ]
      const result = getColumnRelatedChangeStatus({
        tableId: 'users',
        columnId: 'email',
        operations,
      })
      expect(result).toBe('unchanged')
    })
  })

  describe('mixed operations', () => {
    it('should handle mixed operations correctly', () => {
      const operations: Operation[] = [
        // Column operations for users.email
        {
          op: 'replace',
          path: '/tables/users/columns/email/type',
          value: 'text',
        },
        // Other column operations
        { op: 'add', path: '/tables/users/columns/phone', value: mockColumn },
        // Other table column operations
        {
          op: 'replace',
          path: '/tables/products/columns/email/type',
          value: 'varchar',
        },
        // Non-column operations
        {
          op: 'add',
          path: '/tables/users/indexes/idx_email',
          value: {
            name: 'idx_email',
            unique: false,
            columns: ['email'],
            type: 'btree',
          },
        },
      ]
      const result = getColumnRelatedChangeStatus({
        tableId: 'users',
        columnId: 'email',
        operations,
      })
      expect(result).toBe('modified')
    })
  })

  describe('edge cases', () => {
    it('should handle column names with special characters', () => {
      const operations: Operation[] = [
        {
          op: 'add',
          path: '/tables/user_profile/columns/created_at',
          value: mockColumn,
        },
      ]
      const result = getColumnRelatedChangeStatus({
        tableId: 'user_profile',
        columnId: 'created_at',
        operations,
      })
      expect(result).toBe('added')
    })

    it('should handle empty operations array', () => {
      const result = getColumnRelatedChangeStatus({
        tableId: 'users',
        columnId: 'email',
        operations: [],
      })
      expect(result).toBe('unchanged')
    })

    it('should match exact table and column names only', () => {
      const operations: Operation[] = [
        {
          op: 'add',
          path: '/tables/users_old/columns/email',
          value: mockColumn,
        },
        {
          op: 'add',
          path: '/tables/users/columns/email_old',
          value: mockColumn,
        },
      ]
      const result = getColumnRelatedChangeStatus({
        tableId: 'users',
        columnId: 'email',
        operations,
      })
      expect(result).toBe('unchanged')
    })
  })

  describe('without columnId', () => {
    it('should return "added" when any column is added to the table', () => {
      const operations: Operation[] = [
        { op: 'add', path: '/tables/users/columns/email', value: mockColumn },
        { op: 'add', path: '/tables/users/columns/name', value: mockColumn },
      ]
      const result = getColumnRelatedChangeStatus({
        tableId: 'users',
        operations,
      })
      expect(result).toBe('added')
    })

    it('should return "removed" when any column is removed from the table', () => {
      const operations: Operation[] = [
        { op: 'remove', path: '/tables/users/columns/email' },
        { op: 'remove', path: '/tables/users/columns/name' },
      ]
      const result = getColumnRelatedChangeStatus({
        tableId: 'users',
        operations,
      })
      expect(result).toBe('removed')
    })

    it('should return "modified" when any column is modified in the table', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users/columns/email/type',
          value: 'text',
        },
        {
          op: 'replace',
          path: '/tables/users/columns/name/notNull',
          value: true,
        },
      ]
      const result = getColumnRelatedChangeStatus({
        tableId: 'users',
        operations,
      })
      expect(result).toBe('modified')
    })

    it('should return "unchanged" when no column operations exist for the table', () => {
      const operations: Operation[] = [
        { op: 'add', path: '/tables/products/columns/id', value: mockColumn },
        {
          op: 'add',
          path: '/tables/users/indexes/idx_email',
          value: {
            name: 'idx_email',
            unique: false,
            columns: ['email'],
            type: 'btree',
          },
        },
      ]
      const result = getColumnRelatedChangeStatus({
        tableId: 'users',
        operations,
      })
      expect(result).toBe('unchanged')
    })

    it('should return correct status for mixed column operations', () => {
      const operations: Operation[] = [
        { op: 'add', path: '/tables/users/columns/phone', value: mockColumn },
        { op: 'remove', path: '/tables/users/columns/deprecated' },
        {
          op: 'replace',
          path: '/tables/users/columns/email/type',
          value: 'text',
        },
      ]
      const result = getColumnRelatedChangeStatus({
        tableId: 'users',
        operations,
      })
      expect(result).toBe('modified')
    })
  })
})
