import { describe, expect, it } from 'vitest'
import { PATH_PATTERNS } from '../../constants.js'
import type { Operation } from '../../schema/index.js'
import { determineChangeStatus } from '../determineChangeStatus.js'

// Mock column data for tests
const mockColumn = {
  name: 'test_column',
  type: 'varchar',
  default: null,
  check: null,
  notNull: false,
  comment: null,
}

describe('determineChangeStatus', () => {
  it('should return "unchanged" when operations array is empty', () => {
    const result = determineChangeStatus({ operations: [] })
    expect(result).toBe('unchanged')
  })

  describe('replace operations', () => {
    it('should return "modified" when there is a replace operation', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users/columns/id/type',
          value: 'bigint',
        },
      ]
      const result = determineChangeStatus({ operations })
      expect(result).toBe('modified')
    })

    it('should return "modified" when there are multiple operations including replace', () => {
      const operations: Operation[] = [
        {
          op: 'add',
          path: '/tables/users/columns/created_at',
          value: mockColumn,
        },
        {
          op: 'replace',
          path: '/tables/users/columns/id/type',
          value: 'bigint',
        },
        { op: 'remove', path: '/tables/users/columns/deleted_at' },
      ]
      const result = determineChangeStatus({ operations })
      expect(result).toBe('modified')
    })
  })

  describe('add operations', () => {
    it('should return "added" when there is only an add operation', () => {
      const operations: Operation[] = [
        { op: 'add', path: '/tables/users/columns/email', value: mockColumn },
      ]
      const result = determineChangeStatus({ operations })
      expect(result).toBe('added')
    })

    it('should return "added" when there are multiple add operations', () => {
      const operations: Operation[] = [
        { op: 'add', path: '/tables/users/columns/email', value: mockColumn },
        { op: 'add', path: '/tables/users/columns/phone', value: mockColumn },
      ]
      const result = determineChangeStatus({ operations })
      expect(result).toBe('added')
    })
  })

  describe('remove operations', () => {
    it('should return "removed" when there is only a remove operation', () => {
      const operations: Operation[] = [
        { op: 'remove', path: '/tables/users/columns/deprecated_field' },
      ]
      const result = determineChangeStatus({ operations })
      expect(result).toBe('removed')
    })

    it('should return "removed" when there are multiple remove operations', () => {
      const operations: Operation[] = [
        { op: 'remove', path: '/tables/users/columns/field1' },
        { op: 'remove', path: '/tables/users/columns/field2' },
      ]
      const result = determineChangeStatus({ operations })
      expect(result).toBe('removed')
    })
  })

  describe('mixed add and remove operations', () => {
    it('should return "modified" when there are both add and remove operations', () => {
      const operations: Operation[] = [
        {
          op: 'add',
          path: '/tables/users/columns/new_field',
          value: mockColumn,
        },
        { op: 'remove', path: '/tables/users/columns/old_field' },
      ]
      const result = determineChangeStatus({ operations })
      expect(result).toBe('modified')
    })

    it('should return "modified" when there are multiple add and remove operations', () => {
      const operations: Operation[] = [
        { op: 'add', path: '/tables/users/columns/field1', value: mockColumn },
        { op: 'add', path: '/tables/users/columns/field2', value: mockColumn },
        { op: 'remove', path: '/tables/users/columns/field3' },
        { op: 'remove', path: '/tables/users/columns/field4' },
      ]
      const result = determineChangeStatus({ operations })
      expect(result).toBe('modified')
    })
  })

  describe('edge cases', () => {
    it('should handle operations with complex paths', () => {
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/tables/users/constraints/users_pkey/columns/0',
          value: 'uuid',
        },
      ]
      const result = determineChangeStatus({ operations })
      expect(result).toBe('modified')
    })

    it('should handle operations with nested values', () => {
      const operations: Operation[] = [
        {
          op: 'add',
          path: '/tables/products/columns/metadata',
          value: {
            name: 'metadata',
            type: 'jsonb',
            notNull: false,
            default: null,
            check: null,
            comment: null,
          },
        },
      ]
      const result = determineChangeStatus({ operations })
      expect(result).toBe('added')
    })
  })
})

describe('determineChangeStatus with customModificationChecker', () => {
  it('should return "modified" when customModificationChecker returns true', () => {
    const operations: Operation[] = [
      {
        op: 'add',
        path: '/tables/users/indexes/idx_composite/columns/2',
        value: 'created_at',
      },
    ]

    const customChecker = (ops: Operation[]) =>
      ops.some((op) => PATH_PATTERNS.INDEX_COLUMNS_ELEMENT.test(op.path))

    const result = determineChangeStatus({
      operations,
      customModificationChecker: customChecker,
    })
    expect(result).toBe('modified')
  })

  it('should fallback to default logic when customModificationChecker returns false', () => {
    const operations: Operation[] = [
      {
        op: 'add',
        path: '/tables/users/indexes/idx_new',
        value: { name: 'idx_new', columns: ['id'], unique: false, type: '' },
      },
    ]

    const customChecker = (ops: Operation[]) =>
      ops.some((op) => PATH_PATTERNS.INDEX_COLUMNS_ELEMENT.test(op.path))

    const result = determineChangeStatus({
      operations,
      customModificationChecker: customChecker,
    })
    expect(result).toBe('added')
  })

  it('should work without customModificationChecker (backward compatibility)', () => {
    const operations: Operation[] = [
      {
        op: 'replace',
        path: '/tables/users/columns/id/type',
        value: 'bigint',
      },
    ]

    const result = determineChangeStatus({ operations })
    expect(result).toBe('modified')
  })
})
