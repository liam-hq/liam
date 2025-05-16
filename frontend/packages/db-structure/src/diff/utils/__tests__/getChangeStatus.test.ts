import type { Operation } from 'fast-json-patch'
import { describe, expect, it } from 'vitest'
import { PATH_PATTERNS } from '../../constants.js'
import { getChangeStatus } from '../getChangeStatus.js'

describe('getChangeStatus', () => {
  const tableId = 'users'

  it('should return "unchanged" when there are no operations', () => {
    const operations: Operation[] = []
    const result = getChangeStatus({
      tableId,
      operations,
      pathRegExp: PATH_PATTERNS.TABLE_BASE,
    })
    expect(result).toBe('unchanged')
  })

  it('should return "unchanged" when no operations match the tableId', () => {
    const operations: Operation[] = [
      {
        op: 'add',
        path: '/tables/projects/columns/description',
        value: {
          name: 'description',
          type: 'text',
          default: null,
          check: null,
          primary: false,
          unique: false,
          notNull: false,
          comment: 'Project description',
        },
      },
    ]
    const result = getChangeStatus({
      tableId,
      operations,
      pathRegExp: PATH_PATTERNS.TABLE_BASE,
    })
    expect(result).toBe('unchanged')
  })

  it('should return "added" when an add operation exists', () => {
    const operations: Operation[] = [
      {
        op: 'add',
        path: '/tables/users',
        value: {
          name: 'users',
        },
      },
    ]
    const result = getChangeStatus({
      tableId,
      operations,
      pathRegExp: PATH_PATTERNS.TABLE_BASE,
    })
    expect(result).toBe('added')
  })

  it('should return "removed" when a remove operation exists', () => {
    const operations: Operation[] = [
      {
        op: 'remove',
        path: '/tables/users',
      },
    ]
    const result = getChangeStatus({
      tableId,
      operations,
      pathRegExp: PATH_PATTERNS.TABLE_BASE,
    })
    expect(result).toBe('removed')
  })

  it('should return "modified" when a replace operation exists', () => {
    const operations: Operation[] = [
      {
        op: 'replace',
        path: '/tables/users/comment',
        value: 'User table comment',
      },
    ]
    const result = getChangeStatus({
      tableId,
      operations,
      pathRegExp: PATH_PATTERNS.TABLE_COMMENT,
    })
    expect(result).toBe('modified')
  })

  it('should return "modified" when both add and remove operations exist', () => {
    const operations: Operation[] = [
      {
        op: 'remove',
        path: '/tables/users',
      },
      {
        op: 'add',
        path: '/tables/users',
        value: {
          name: 'users',
        },
      },
    ]
    const result = getChangeStatus({
      tableId,
      operations,
      pathRegExp: PATH_PATTERNS.TABLE_BASE,
    })
    expect(result).toBe('modified')
  })

  it('should handle complex operations with different path patterns', () => {
    const operations: Operation[] = [
      {
        op: 'add',
        path: '/tables/organizations',
        value: {
          name: 'organizations',
        },
      },
      {
        op: 'remove',
        path: '/tables/users',
      },
      {
        op: 'replace',
        path: '/tables/organizations/comment',
        value: 'Stores organization information',
      },
    ]

    const tableCommentResult = getChangeStatus({
      tableId: 'organizations',
      operations,
      pathRegExp: PATH_PATTERNS.TABLE_COMMENT,
    })
    expect(tableCommentResult).toBe('modified')
  })
})
