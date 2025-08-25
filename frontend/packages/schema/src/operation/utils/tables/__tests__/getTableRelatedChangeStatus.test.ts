import { describe, expect, it } from 'vitest'
import type { Operation } from '../../../index.js'
import { getTableRelatedChangeStatus } from '../getTableRelatedChangeStatus.js'

// Mock table data for tests
const mockTable = {
  name: 'test_table',
  columns: {},
  comment: null,
  indexes: {},
  constraints: {},
}

// Mock column data for tests
const mockColumn = {
  name: 'test_column',
  type: 'varchar',
  default: null,
  check: null,
  notNull: false,
  comment: null,
}

describe('getTableRelatedChangeStatus', () => {
  it('should return "unchanged" when no operations match the table', () => {
    const operations: Operation[] = [
      { op: 'add', path: '/tables/other_table/columns/id', value: mockColumn },
      { op: 'remove', path: '/tables/another_table' },
    ]
    const result = getTableRelatedChangeStatus({
      tableId: 'users',
      operations,
    })
    expect(result).toBe('unchanged')
  })

  describe('table-level operations', () => {
    it('should return "added" when table is added', () => {
      const operations: Operation[] = [
        { op: 'add', path: '/tables/users', value: mockTable },
      ]
      const result = getTableRelatedChangeStatus({
        tableId: 'users',
        operations,
      })
      expect(result).toBe('added')
    })

    it('should return "removed" when table is removed', () => {
      const operations: Operation[] = [{ op: 'remove', path: '/tables/users' }]
      const result = getTableRelatedChangeStatus({
        tableId: 'users',
        operations,
      })
      expect(result).toBe('removed')
    })

    it('should return "modified" when table name is changed', () => {
      const operations: Operation[] = [
        { op: 'replace', path: '/tables/users/name', value: 'customers' },
      ]
      const result = getTableRelatedChangeStatus({
        tableId: 'users',
        operations,
      })
      expect(result).toBe('modified')
    })

    it('should return "modified" when table comment is changed', () => {
      const operations: Operation[] = [
        { op: 'replace', path: '/tables/users/comment', value: 'User data' },
      ]
      const result = getTableRelatedChangeStatus({
        tableId: 'users',
        operations,
      })
      expect(result).toBe('modified')
    })
  })

  describe('filtering operations', () => {
    it('should only consider operations for the specified table', () => {
      const operations: Operation[] = [
        { op: 'add', path: '/tables/users', value: mockTable },
        { op: 'add', path: '/tables/products', value: mockTable },
        { op: 'remove', path: '/tables/orders' },
      ]
      const result = getTableRelatedChangeStatus({
        tableId: 'users',
        operations,
      })
      expect(result).toBe('added')
    })

    it('should ignore non-table operations', () => {
      const operations: Operation[] = [
        { op: 'add', path: '/tables/users/columns/id', value: mockColumn },
        { op: 'remove', path: '/tables/users/indexes/idx_email' },
        {
          op: 'replace',
          path: '/tables/users/columns/name/type',
          value: 'text',
        },
      ]
      const result = getTableRelatedChangeStatus({
        tableId: 'users',
        operations,
      })
      expect(result).toBe('unchanged')
    })
  })

  describe('multiple operations', () => {
    it('should return "modified" when table has multiple changes', () => {
      const operations: Operation[] = [
        { op: 'replace', path: '/tables/users/name', value: 'customers' },
        {
          op: 'replace',
          path: '/tables/users/comment',
          value: 'Customer data',
        },
      ]
      const result = getTableRelatedChangeStatus({
        tableId: 'users',
        operations,
      })
      expect(result).toBe('modified')
    })

    it('should handle mixed operations correctly', () => {
      const operations: Operation[] = [
        // Table-level operations for 'users'
        {
          op: 'replace',
          path: '/tables/users/comment',
          value: 'Updated comment',
        },
        // Other table operations
        { op: 'add', path: '/tables/products', value: mockTable },
        // Non-table operations for 'users'
        { op: 'add', path: '/tables/users/columns/email', value: mockColumn },
      ]
      const result = getTableRelatedChangeStatus({
        tableId: 'users',
        operations,
      })
      expect(result).toBe('modified')
    })
  })

  describe('edge cases', () => {
    it('should handle table names with special characters', () => {
      const operations: Operation[] = [
        { op: 'add', path: '/tables/user_profile', value: mockTable },
      ]
      const result = getTableRelatedChangeStatus({
        tableId: 'user_profile',
        operations,
      })
      expect(result).toBe('added')
    })

    it('should handle empty operations array', () => {
      const result = getTableRelatedChangeStatus({
        tableId: 'users',
        operations: [],
      })
      expect(result).toBe('unchanged')
    })

    it('should match exact table names only', () => {
      const operations: Operation[] = [
        { op: 'add', path: '/tables/users_old', value: mockTable },
        { op: 'add', path: '/tables/new_users', value: mockTable },
      ]
      const result = getTableRelatedChangeStatus({
        tableId: 'users',
        operations,
      })
      expect(result).toBe('unchanged')
    })
  })
})
