import type { Operation } from 'fast-json-patch'
import { describe, expect, it, vi } from 'vitest'
import type { Schema } from '../../../schema/index.js'
import { PATH_PATTERNS } from '../../constants.js'
import { getChangeStatus } from '../../utils/getChangeStatus.js'
import { buildTableCommentDiffItem } from '../buildTableCommentDiffItem.js'

vi.mock('../../utils/getChangeStatus.ts', () => ({
  getChangeStatus: vi.fn(),
}))

describe('buildTableCommentDiffItem', () => {
  const mockTableId = 'table1'

  const baseSchema: Schema = {
    tables: {
      table1: {
        name: 'Table 1',
        columns: {},
        comment: null,
        indexes: {},
        constraints: {},
      },
    },
    relationships: {},
    tableGroups: {},
  }

  // Base test schema with existence checks
  const beforeSchema: Schema = structuredClone(baseSchema)
  if (beforeSchema.tables['table1']) {
    beforeSchema.tables['table1'].comment = 'Previous comment'
  }

  const afterSchema: Schema = structuredClone(baseSchema)
  if (afterSchema.tables['table1']) {
    afterSchema.tables['table1'].comment = 'Updated comment'
  }

  const mockOperations: Operation[] = [
    {
      op: 'replace',
      path: `/tables/${mockTableId}/comment`,
      value: 'Updated comment',
    },
  ]

  it('should return TableCommentDiffItem with "added" status when comment is added', () => {
    const noCommentBeforeSchema: Schema = structuredClone(baseSchema)
    if (noCommentBeforeSchema.tables['table1']) {
      noCommentBeforeSchema.tables['table1'].comment = null
    }

    const withCommentAfterSchema: Schema = structuredClone(baseSchema)
    if (withCommentAfterSchema.tables['table1']) {
      withCommentAfterSchema.tables['table1'].comment = 'New comment'
    }

    const addOperations: Operation[] = [
      { op: 'add', path: '/tables/table1/comment', value: 'New comment' },
    ]

    // Set mock return value
    vi.mocked(getChangeStatus).mockReturnValue('added')

    const result = buildTableCommentDiffItem(
      mockTableId,
      noCommentBeforeSchema,
      withCommentAfterSchema,
      addOperations,
    )

    expect(getChangeStatus).toHaveBeenCalledWith({
      tableId: mockTableId,
      operations: addOperations,
      pathRegExp: PATH_PATTERNS.TABLE_COMMENT,
    })
    expect(result).toEqual({
      kind: 'table-comment',
      status: 'added',
      data: 'New comment',
      tableId: mockTableId,
    })
  })

  it('should return TableCommentDiffItem with "removed" status when comment is removed', () => {
    const withCommentBeforeSchema: Schema = structuredClone(baseSchema)
    if (withCommentBeforeSchema.tables['table1']) {
      withCommentBeforeSchema.tables['table1'].comment = 'Comment to be removed'
    }

    const noCommentAfterSchema: Schema = structuredClone(baseSchema)
    if (noCommentAfterSchema.tables['table1']) {
      noCommentAfterSchema.tables['table1'].comment = null
    }

    const removeOperations: Operation[] = [
      { op: 'remove', path: '/tables/table1/comment' },
    ]

    // Set mock return value
    vi.mocked(getChangeStatus).mockReturnValue('removed')

    const result = buildTableCommentDiffItem(
      mockTableId,
      withCommentBeforeSchema,
      noCommentAfterSchema,
      removeOperations,
    )

    expect(getChangeStatus).toHaveBeenCalledWith({
      tableId: mockTableId,
      operations: removeOperations,
      pathRegExp: PATH_PATTERNS.TABLE_COMMENT,
    })
    expect(result).toEqual({
      kind: 'table-comment',
      status: 'removed',
      data: 'Comment to be removed',
      tableId: mockTableId,
    })
  })

  it('should return TableCommentDiffItem with "modified" status when comment is modified', () => {
    // Set mock return value
    vi.mocked(getChangeStatus).mockReturnValue('modified')

    const result = buildTableCommentDiffItem(
      mockTableId,
      beforeSchema,
      afterSchema,
      mockOperations,
    )

    expect(getChangeStatus).toHaveBeenCalledWith({
      tableId: mockTableId,
      operations: mockOperations,
      pathRegExp: PATH_PATTERNS.TABLE_COMMENT,
    })
    expect(result).toEqual({
      kind: 'table-comment',
      status: 'modified',
      data: 'Updated comment',
      tableId: mockTableId,
    })
  })

  it('should return null status when comment is not changed', () => {
    const unchangedSchema: Schema = structuredClone(baseSchema)
    if (unchangedSchema.tables['table1']) {
      unchangedSchema.tables['table1'].comment = 'Unchanged comment'
    }

    const noOperations: Operation[] = []

    // Set mock return value
    vi.mocked(getChangeStatus).mockReturnValue('unchanged')

    const result = buildTableCommentDiffItem(
      mockTableId,
      unchangedSchema,
      unchangedSchema,
      noOperations,
    )

    expect(getChangeStatus).toHaveBeenCalledWith({
      tableId: mockTableId,
      operations: noOperations,
      pathRegExp: PATH_PATTERNS.TABLE_COMMENT,
    })
    expect(result).toEqual(null)
  })

  it('should return null when table does not exist', () => {
    const nonExistentTableId = 'nonExistentTable'

    // Set mock return value
    vi.mocked(getChangeStatus).mockReturnValue('added')

    const result = buildTableCommentDiffItem(
      nonExistentTableId,
      beforeSchema,
      afterSchema,
      mockOperations,
    )

    expect(getChangeStatus).toHaveBeenCalledWith({
      tableId: nonExistentTableId,
      operations: mockOperations,
      pathRegExp: PATH_PATTERNS.TABLE_COMMENT,
    })
    expect(result).toBeNull()
  })
})
