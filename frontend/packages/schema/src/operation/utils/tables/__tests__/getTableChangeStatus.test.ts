import { describe, expect, it } from 'vitest'
import type { Operation } from '../../../schema/index.js'
import { getTableChangeStatus } from '../getTableChangeStatus.js'

describe('getTableChangeStatus', () => {
  it('should return "unchanged" when no operations match the table', () => {
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
    ]
    const result = getTableChangeStatus({
      tableId: 'users',
      operations,
    })
    expect(result).toBe('unchanged')
  })

  describe('table operations', () => {
    it('should return "added" when table is added', () => {
      const operations: Operation[] = [
        {
          op: 'add',
          path: '/tables/users',
          value: {
            name: 'users',
            columns: {},
            indexes: {},
            constraints: {},
            comment: null,
          },
        },
      ]
      const result = getTableChangeStatus({
        tableId: 'users',
        operations,
      })
      expect(result).toBe('added')
    })

    it('should return "removed" when table is removed', () => {
      const operations: Operation[] = [{ op: 'remove', path: '/tables/users' }]
      const result = getTableChangeStatus({
        tableId: 'users',
        operations,
      })
      expect(result).toBe('removed')
    })

    it('should return "modified" when table name is changed', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users/name',
          value: 'customers',
        },
      ]
      const result = getTableChangeStatus({
        tableId: 'users',
        operations,
      })
      expect(result).toBe('modified')
    })

    it('should return "modified" when table comment is changed', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users/comment',
          value: 'User information table',
        },
      ]
      const result = getTableChangeStatus({
        tableId: 'users',
        operations,
      })
      expect(result).toBe('modified')
    })
  })

  describe('multiple table operations', () => {
    it('should return "modified" when multiple properties are changed', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users/name',
          value: 'customers',
        },
        {
          op: 'replace',
          path: '/tables/users/comment',
          value: 'Customer information',
        },
      ]
      const result = getTableChangeStatus({
        tableId: 'users',
        operations,
      })
      expect(result).toBe('modified')
    })
  })

  describe('filtering operations', () => {
    it('should only consider operations for the specified table', () => {
      const operations: Operation[] = [
        {
          op: 'add',
          path: '/tables/users',
          value: {
            name: 'users',
            columns: {},
            indexes: {},
            constraints: {},
            comment: null,
          },
        },
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
      ]
      const result = getTableChangeStatus({
        tableId: 'users',
        operations,
      })
      expect(result).toBe('added')
    })

    it('should ignore non-table operations', () => {
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
      ]
      const result = getTableChangeStatus({
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
          op: 'add',
          path: '/tables/user_profile',
          value: {
            name: 'user_profile',
            columns: {},
            indexes: {},
            constraints: {},
            comment: null,
          },
        },
      ]
      const result = getTableChangeStatus({
        tableId: 'user_profile',
        operations,
      })
      expect(result).toBe('added')
    })

    it('should handle empty operations array', () => {
      const result = getTableChangeStatus({
        tableId: 'users',
        operations: [],
      })
      expect(result).toBe('unchanged')
    })

    it('should match exact table names only', () => {
      const operations: Operation[] = [
        {
          op: 'add',
          path: '/tables/users_old',
          value: {
            name: 'users_old',
            columns: {},
            indexes: {},
            constraints: {},
            comment: null,
          },
        },
        {
          op: 'replace',
          path: '/tables/new_users/name',
          value: 'users',
        },
      ]
      const result = getTableChangeStatus({
        tableId: 'users',
        operations,
      })
      expect(result).toBe('unchanged')
    })

    it('should handle table names that are substrings of other table names', () => {
      const operations: Operation[] = [
        {
          op: 'add',
          path: '/tables/user',
          value: {
            name: 'user',
            columns: {},
            indexes: {},
            constraints: {},
            comment: null,
          },
        },
        {
          op: 'add',
          path: '/tables/users',
          value: {
            name: 'users',
            columns: {},
            indexes: {},
            constraints: {},
            comment: null,
          },
        },
        {
          op: 'add',
          path: '/tables/user_profile',
          value: {
            name: 'user_profile',
            columns: {},
            indexes: {},
            constraints: {},
            comment: null,
          },
        },
      ]

      expect(getTableChangeStatus({ tableId: 'user', operations })).toBe(
        'added',
      )
      expect(getTableChangeStatus({ tableId: 'users', operations })).toBe(
        'added',
      )
      expect(
        getTableChangeStatus({ tableId: 'user_profile', operations }),
      ).toBe('added')
    })
  })
})
