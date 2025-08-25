import { describe, expect, it } from 'vitest'
import type { Operation } from '../../../schema/index.js'
import { getColumnCommentChangeStatus } from '../getColumnCommentChangeStatus.js'

describe('getColumnCommentChangeStatus', () => {
  it('should return "unchanged" when no operations match the column comment', () => {
    const operations: Operation[] = [
      {
        op: 'add',
        path: '/tables/users/columns/id',
        value: {
          name: 'id',
          type: 'integer',
          default: null,
          check: null,
          notNull: true,
          comment: null,
        },
      },
      { op: 'remove', path: '/tables/users/columns/deleted_at' },
      {
        op: 'replace',
        path: '/tables/users/columns/email/type',
        value: 'text',
      },
      {
        op: 'replace',
        path: '/tables/products/columns/name/comment',
        value: 'Product name',
      },
    ]
    const result = getColumnCommentChangeStatus({
      tableId: 'users',
      columnId: 'email',
      operations,
    })
    expect(result).toBe('unchanged')
  })

  describe('column comment operations', () => {
    it('should return "modified" when column comment is replaced', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users/columns/email/comment',
          value: 'User email address',
        },
      ]
      const result = getColumnCommentChangeStatus({
        tableId: 'users',
        columnId: 'email',
        operations,
      })
      expect(result).toBe('modified')
    })

    it('should return "modified" when column comment is replaced with null', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users/columns/email/comment',
          value: null,
        },
      ]
      const result = getColumnCommentChangeStatus({
        tableId: 'users',
        columnId: 'email',
        operations,
      })
      expect(result).toBe('modified')
    })
  })

  describe('filtering operations', () => {
    it('should only consider operations for the specified column comment', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users/columns/email/comment',
          value: 'Primary email',
        },
        {
          op: 'replace',
          path: '/tables/users/columns/name/comment',
          value: 'Full name',
        },
        {
          op: 'replace',
          path: '/tables/products/columns/email/comment',
          value: 'Contact email',
        },
      ]
      const result = getColumnCommentChangeStatus({
        tableId: 'users',
        columnId: 'email',
        operations,
      })
      expect(result).toBe('modified')
    })

    it('should ignore non-comment operations', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users/columns/email/type',
          value: 'text',
        },
        {
          op: 'replace',
          path: '/tables/users/columns/email/notNull',
          value: false,
        },
        {
          op: 'replace',
          path: '/tables/users/columns/email/default',
          value: 'default@example.com',
        },
      ]
      const result = getColumnCommentChangeStatus({
        tableId: 'users',
        columnId: 'email',
        operations,
      })
      expect(result).toBe('unchanged')
    })

    it('should require both table and column to match', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/products/columns/email/comment',
          value: 'Product contact email',
        },
        {
          op: 'replace',
          path: '/tables/users/columns/phone/comment',
          value: 'User phone number',
        },
      ]
      const result = getColumnCommentChangeStatus({
        tableId: 'users',
        columnId: 'email',
        operations,
      })
      expect(result).toBe('unchanged')
    })
  })

  describe('edge cases', () => {
    it('should handle column names with special characters', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users/columns/created_at/comment',
          value: 'Record creation timestamp',
        },
      ]
      const result = getColumnCommentChangeStatus({
        tableId: 'users',
        columnId: 'created_at',
        operations,
      })
      expect(result).toBe('modified')
    })

    it('should handle empty operations array', () => {
      const result = getColumnCommentChangeStatus({
        tableId: 'users',
        columnId: 'email',
        operations: [],
      })
      expect(result).toBe('unchanged')
    })

    it('should match exact column names only', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users/columns/email_old/comment',
          value: 'Archived email',
        },
        {
          op: 'replace',
          path: '/tables/users/columns/new_email/comment',
          value: 'New email address',
        },
      ]
      const result = getColumnCommentChangeStatus({
        tableId: 'users',
        columnId: 'email',
        operations,
      })
      expect(result).toBe('unchanged')
    })

    it('should handle column names that are substrings of other column names', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users/columns/id/comment',
          value: 'User ID',
        },
        {
          op: 'replace',
          path: '/tables/users/columns/user_id/comment',
          value: 'Related user ID',
        },
        {
          op: 'replace',
          path: '/tables/users/columns/id_number/comment',
          value: 'ID card number',
        },
      ]

      expect(
        getColumnCommentChangeStatus({
          tableId: 'users',
          columnId: 'id',
          operations,
        }),
      ).toBe('modified')
      expect(
        getColumnCommentChangeStatus({
          tableId: 'users',
          columnId: 'user_id',
          operations,
        }),
      ).toBe('modified')
      expect(
        getColumnCommentChangeStatus({
          tableId: 'users',
          columnId: 'id_number',
          operations,
        }),
      ).toBe('modified')
    })

    it('should handle multiple comment operations for the same column', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users/columns/email/comment',
          value: 'Initial comment',
        },
        {
          op: 'replace',
          path: '/tables/users/columns/email/comment',
          value: 'Updated comment',
        },
      ]
      const result = getColumnCommentChangeStatus({
        tableId: 'users',
        columnId: 'email',
        operations,
      })
      expect(result).toBe('modified')
    })

    it('should handle columns with numeric suffixes', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users/columns/email2/comment',
          value: 'Secondary email',
        },
        {
          op: 'replace',
          path: '/tables/users/columns/email_v2/comment',
          value: 'Version 2 email',
        },
      ]

      expect(
        getColumnCommentChangeStatus({
          tableId: 'users',
          columnId: 'email',
          operations,
        }),
      ).toBe('unchanged')
      expect(
        getColumnCommentChangeStatus({
          tableId: 'users',
          columnId: 'email2',
          operations,
        }),
      ).toBe('modified')
      expect(
        getColumnCommentChangeStatus({
          tableId: 'users',
          columnId: 'email_v2',
          operations,
        }),
      ).toBe('modified')
    })

    it('should handle table names with special characters', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/user_profiles/columns/bio/comment',
          value: 'User biography',
        },
      ]
      const result = getColumnCommentChangeStatus({
        tableId: 'user_profiles',
        columnId: 'bio',
        operations,
      })
      expect(result).toBe('modified')
    })
  })
})
