import { describe, expect, it } from 'vitest'
import type { Operation } from '../../../schema/index.js'
import { getIndexRelatedChangeStatus } from '../getIndexRelatedChangeStatus.js'

// Mock index data for tests
const mockIndex = {
  name: 'test_index',
  unique: false,
  columns: ['column1'],
  type: 'btree',
}

describe('getIndexRelatedChangeStatus', () => {
  it('should return "unchanged" when no operations match the table and index', () => {
    const operations: Operation[] = [
      {
        op: 'add',
        path: '/tables/other_table/indexes/idx_name',
        value: mockIndex,
      },
      { op: 'remove', path: '/tables/another_table/indexes/idx_id' },
    ]
    const result = getIndexRelatedChangeStatus({
      tableId: 'users',
      indexId: 'idx_email',
      operations,
    })
    expect(result).toBe('unchanged')
  })

  describe('index operations', () => {
    it('should return "added" when index is added', () => {
      const operations: Operation[] = [
        {
          op: 'add',
          path: '/tables/users/indexes/idx_email',
          value: mockIndex,
        },
      ]
      const result = getIndexRelatedChangeStatus({
        tableId: 'users',
        indexId: 'idx_email',
        operations,
      })
      expect(result).toBe('added')
    })

    it('should return "removed" when index is removed', () => {
      const operations: Operation[] = [
        { op: 'remove', path: '/tables/users/indexes/idx_email' },
      ]
      const result = getIndexRelatedChangeStatus({
        tableId: 'users',
        indexId: 'idx_email',
        operations,
      })
      expect(result).toBe('removed')
    })

    it('should return "modified" when index name is changed', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users/indexes/idx_email/name',
          value: 'idx_user_email',
        },
      ]
      const result = getIndexRelatedChangeStatus({
        tableId: 'users',
        indexId: 'idx_email',
        operations,
      })
      expect(result).toBe('modified')
    })

    it('should return "modified" when index unique property is changed', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users/indexes/idx_email/unique',
          value: true,
        },
      ]
      const result = getIndexRelatedChangeStatus({
        tableId: 'users',
        indexId: 'idx_email',
        operations,
      })
      expect(result).toBe('modified')
    })
  })

  describe('filtering operations', () => {
    it('should only consider operations for the specified table and index', () => {
      const operations: Operation[] = [
        {
          op: 'add',
          path: '/tables/users/indexes/idx_email',
          value: mockIndex,
        },
        { op: 'add', path: '/tables/users/indexes/idx_name', value: mockIndex },
        {
          op: 'add',
          path: '/tables/products/indexes/idx_email',
          value: mockIndex,
        },
      ]
      const result = getIndexRelatedChangeStatus({
        tableId: 'users',
        indexId: 'idx_email',
        operations,
      })
      expect(result).toBe('added')
    })

    it('should ignore operations for other indexes in the same table', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users/indexes/idx_name/type',
          value: 'hash',
        },
        {
          op: 'replace',
          path: '/tables/users/indexes/idx_age/unique',
          value: true,
        },
        { op: 'remove', path: '/tables/users/indexes/idx_deprecated' },
      ]
      const result = getIndexRelatedChangeStatus({
        tableId: 'users',
        indexId: 'idx_email',
        operations,
      })
      expect(result).toBe('unchanged')
    })

    it('should ignore non-index operations', () => {
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
        { op: 'remove', path: '/tables/users/constraints/users_pkey' },
        { op: 'replace', path: '/tables/users/name', value: 'customers' },
      ]
      const result = getIndexRelatedChangeStatus({
        tableId: 'users',
        indexId: 'idx_email',
        operations,
      })
      expect(result).toBe('unchanged')
    })
  })

  describe('mixed operations', () => {
    it('should handle mixed operations correctly', () => {
      const operations: Operation[] = [
        // Index operations for users.idx_email
        {
          op: 'replace',
          path: '/tables/users/indexes/idx_email/unique',
          value: true,
        },
        // Other index operations
        {
          op: 'add',
          path: '/tables/users/indexes/idx_phone',
          value: mockIndex,
        },
        // Other table index operations
        {
          op: 'replace',
          path: '/tables/products/indexes/idx_email/type',
          value: 'hash',
        },
        // Non-index operations
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
      const result = getIndexRelatedChangeStatus({
        tableId: 'users',
        indexId: 'idx_email',
        operations,
      })
      expect(result).toBe('modified')
    })
  })

  describe('edge cases', () => {
    it('should handle index names with special characters', () => {
      const operations: Operation[] = [
        {
          op: 'add',
          path: '/tables/user_profile/indexes/idx_user_email',
          value: mockIndex,
        },
      ]
      const result = getIndexRelatedChangeStatus({
        tableId: 'user_profile',
        indexId: 'idx_user_email',
        operations,
      })
      expect(result).toBe('added')
    })

    it('should handle empty operations array', () => {
      const result = getIndexRelatedChangeStatus({
        tableId: 'users',
        indexId: 'idx_email',
        operations: [],
      })
      expect(result).toBe('unchanged')
    })

    it('should match exact table and index names only', () => {
      const operations: Operation[] = [
        {
          op: 'add',
          path: '/tables/users_old/indexes/idx_email',
          value: mockIndex,
        },
        {
          op: 'add',
          path: '/tables/users/indexes/idx_email_old',
          value: mockIndex,
        },
      ]
      const result = getIndexRelatedChangeStatus({
        tableId: 'users',
        indexId: 'idx_email',
        operations,
      })
      expect(result).toBe('unchanged')
    })
  })

  describe('without indexId', () => {
    it('should return "added" when any index is added to the table', () => {
      const operations: Operation[] = [
        {
          op: 'add',
          path: '/tables/users/indexes/idx_email',
          value: mockIndex,
        },
        {
          op: 'add',
          path: '/tables/users/indexes/idx_name',
          value: mockIndex,
        },
      ]
      const result = getIndexRelatedChangeStatus({
        tableId: 'users',
        operations,
      })
      expect(result).toBe('added')
    })

    it('should return "removed" when any index is removed from the table', () => {
      const operations: Operation[] = [
        { op: 'remove', path: '/tables/users/indexes/idx_email' },
        { op: 'remove', path: '/tables/users/indexes/idx_name' },
      ]
      const result = getIndexRelatedChangeStatus({
        tableId: 'users',
        operations,
      })
      expect(result).toBe('removed')
    })

    it('should return "modified" when any index is modified in the table', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users/indexes/idx_email/unique',
          value: true,
        },
        {
          op: 'replace',
          path: '/tables/users/indexes/idx_name/type',
          value: 'hash',
        },
      ]
      const result = getIndexRelatedChangeStatus({
        tableId: 'users',
        operations,
      })
      expect(result).toBe('modified')
    })

    it('should return "unchanged" when no index operations exist for the table', () => {
      const operations: Operation[] = [
        {
          op: 'add',
          path: '/tables/products/indexes/idx_id',
          value: mockIndex,
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
      const result = getIndexRelatedChangeStatus({
        tableId: 'users',
        operations,
      })
      expect(result).toBe('unchanged')
    })

    it('should return correct status for mixed index operations', () => {
      const operations: Operation[] = [
        {
          op: 'add',
          path: '/tables/users/indexes/idx_phone',
          value: mockIndex,
        },
        { op: 'remove', path: '/tables/users/indexes/idx_deprecated' },
      ]
      const result = getIndexRelatedChangeStatus({
        tableId: 'users',
        operations,
      })
      expect(result).toBe('modified')
    })
  })
})
