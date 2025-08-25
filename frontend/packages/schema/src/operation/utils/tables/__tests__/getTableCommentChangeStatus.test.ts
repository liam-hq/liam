import { describe, expect, it } from 'vitest'
import type { Operation } from '../../../schema/index.js'
import { getTableCommentChangeStatus } from '../getTableCommentChangeStatus.js'

describe('getTableCommentChangeStatus', () => {
  it('should return "unchanged" when no operations match the table comment', () => {
    const operations: Operation[] = [
      {
        op: 'add',
        path: '/tables/products',
        value: {
          name: 'products',
          columns: {},
          indexes: {},
          constraints: {},
          comment: null,
        },
      },
      { op: 'remove', path: '/tables/orders' },
      { op: 'replace', path: '/tables/customers/name', value: 'clients' },
      { op: 'replace', path: '/tables/users/name', value: 'members' },
    ]
    const result = getTableCommentChangeStatus({
      tableId: 'users',
      operations,
    })
    expect(result).toBe('unchanged')
  })

  describe('table comment operations', () => {
    it('should return "modified" when table comment is replaced', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users/comment',
          value: 'User information table',
        },
      ]
      const result = getTableCommentChangeStatus({
        tableId: 'users',
        operations,
      })
      expect(result).toBe('modified')
    })

    it('should return "modified" when table comment is replaced with null', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users/comment',
          value: null,
        },
      ]
      const result = getTableCommentChangeStatus({
        tableId: 'users',
        operations,
      })
      expect(result).toBe('modified')
    })
  })

  describe('filtering operations', () => {
    it('should only consider operations for the specified table comment', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users/comment',
          value: 'User accounts',
        },
        {
          op: 'replace',
          path: '/tables/products/comment',
          value: 'Product catalog',
        },
        {
          op: 'replace',
          path: '/tables/orders/comment',
          value: 'Customer orders',
        },
      ]
      const result = getTableCommentChangeStatus({
        tableId: 'users',
        operations,
      })
      expect(result).toBe('modified')
    })

    it('should ignore non-comment operations', () => {
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
        {
          op: 'replace',
          path: '/tables/users/name',
          value: 'customers',
        },
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
      const result = getTableCommentChangeStatus({
        tableId: 'users',
        operations,
      })
      expect(result).toBe('unchanged')
    })
  })

  describe('edge cases', () => {
    it('should handle table names with special characters', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/user_profile/comment',
          value: 'User profile information',
        },
      ]
      const result = getTableCommentChangeStatus({
        tableId: 'user_profile',
        operations,
      })
      expect(result).toBe('modified')
    })

    it('should handle empty operations array', () => {
      const result = getTableCommentChangeStatus({
        tableId: 'users',
        operations: [],
      })
      expect(result).toBe('unchanged')
    })

    it('should match exact table names only', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users_old/comment',
          value: 'Archived users',
        },
        {
          op: 'replace',
          path: '/tables/new_users/comment',
          value: 'New user accounts',
        },
      ]
      const result = getTableCommentChangeStatus({
        tableId: 'users',
        operations,
      })
      expect(result).toBe('unchanged')
    })

    it('should handle table names that are substrings of other table names', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/user/comment',
          value: 'Single user',
        },
        {
          op: 'replace',
          path: '/tables/users/comment',
          value: 'Multiple users',
        },
        {
          op: 'replace',
          path: '/tables/user_profile/comment',
          value: 'User profile data',
        },
      ]

      expect(getTableCommentChangeStatus({ tableId: 'user', operations })).toBe(
        'modified',
      )
      expect(
        getTableCommentChangeStatus({ tableId: 'users', operations }),
      ).toBe('modified')
      expect(
        getTableCommentChangeStatus({ tableId: 'user_profile', operations }),
      ).toBe('modified')
    })

    it('should handle multiple comment operations for the same table', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users/comment',
          value: 'Initial comment',
        },
        {
          op: 'replace',
          path: '/tables/users/comment',
          value: 'Updated comment',
        },
      ]
      const result = getTableCommentChangeStatus({
        tableId: 'users',
        operations,
      })
      expect(result).toBe('modified')
    })

    it('should handle tables with numeric suffixes', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users2/comment',
          value: 'Second user table',
        },
        {
          op: 'replace',
          path: '/tables/users_v2/comment',
          value: 'Version 2 of users',
        },
      ]

      expect(
        getTableCommentChangeStatus({ tableId: 'users', operations }),
      ).toBe('unchanged')
      expect(
        getTableCommentChangeStatus({ tableId: 'users2', operations }),
      ).toBe('modified')
      expect(
        getTableCommentChangeStatus({ tableId: 'users_v2', operations }),
      ).toBe('modified')
    })
  })
})
