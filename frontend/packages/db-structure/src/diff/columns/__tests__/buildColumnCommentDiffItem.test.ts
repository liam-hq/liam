import type { Operation } from 'fast-json-patch'
import { describe, expect, it, vi } from 'vitest'
import { PATH_PATTERNS } from '../../../operation/constants.js'
import type { Schema } from '../../../schema/index.js'
import { getChangeStatus } from '../../utils/getChangeStatus.js'
import { buildColumnCommentDiffItem } from '../buildColumnCommentDiffItem.js'

vi.mock('../../utils/getChangeStatus.ts', () => ({
  getChangeStatus: vi.fn(),
}))

describe('buildColumnCommentDiffItem', () => {
  const mockTableId = 'table1'
  const mockColumnId = 'column1'

  const baseSchema: Schema = {
    tables: {
      table1: {
        name: 'Table 1',
        columns: {
          column1: {
            name: 'Column 1',
            type: 'text',
            default: null,
            check: null,
            primary: false,
            notNull: false,
            comment: null,
            unique: false,
          },
        },
        comment: null,
        indexes: {},
        constraints: {},
      },
    },
    tableGroups: {},
  }

  const beforeSchema: Schema = structuredClone(baseSchema)
  if (beforeSchema.tables[mockTableId]?.columns[mockColumnId]) {
    beforeSchema.tables[mockTableId].columns[mockColumnId].comment =
      'Previous comment'
  }

  const afterSchema: Schema = structuredClone(baseSchema)
  if (afterSchema.tables[mockTableId]?.columns[mockColumnId]) {
    afterSchema.tables[mockTableId].columns[mockColumnId].comment =
      'Updated comment'
  }

  const mockOperations: Operation[] = [
    {
      op: 'replace',
      path: `/tables/${mockTableId}/columns/${mockColumnId}/comment`,
      value: 'Updated comment',
    },
  ]

  it('should return ColumnCommentDiffItem with "added" status when comment is added', () => {
    const noCommentBeforeSchema: Schema = structuredClone(baseSchema)
    if (noCommentBeforeSchema.tables[mockTableId]?.columns[mockColumnId]) {
      noCommentBeforeSchema.tables[mockTableId].columns[mockColumnId].comment =
        null
    }

    const withCommentAfterSchema: Schema = structuredClone(baseSchema)
    if (withCommentAfterSchema.tables[mockTableId]?.columns[mockColumnId]) {
      withCommentAfterSchema.tables[mockTableId].columns[mockColumnId].comment =
        'New comment'
    }

    const addOperations: Operation[] = [
      {
        op: 'add',
        path: `/tables/${mockTableId}/columns/${mockColumnId}/comment`,
        value: 'New comment',
      },
    ]

    vi.mocked(getChangeStatus).mockReturnValue('added')

    const result = buildColumnCommentDiffItem(
      mockTableId,
      mockColumnId,
      noCommentBeforeSchema,
      withCommentAfterSchema,
      addOperations,
    )

    expect(getChangeStatus).toHaveBeenCalledWith({
      tableId: mockTableId,
      columnId: mockColumnId,
      operations: addOperations,
      pathRegExp: PATH_PATTERNS.COLUMN_COMMENT,
    })
    expect(result).toEqual({
      kind: 'column-comment',
      status: 'added',
      data: 'New comment',
      tableId: mockTableId,
      columnId: mockColumnId,
    })
  })

  it('should return ColumnCommentDiffItem with "removed" status when comment is removed', () => {
    const withCommentBeforeSchema: Schema = structuredClone(baseSchema)
    if (withCommentBeforeSchema.tables[mockTableId]?.columns[mockColumnId]) {
      withCommentBeforeSchema.tables[mockTableId].columns[
        mockColumnId
      ].comment = 'Comment to be removed'
    }

    const noCommentAfterSchema: Schema = structuredClone(baseSchema)
    if (noCommentAfterSchema.tables[mockTableId]?.columns[mockColumnId]) {
      noCommentAfterSchema.tables[mockTableId].columns[mockColumnId].comment =
        null
    }

    const removeOperations: Operation[] = [
      {
        op: 'remove',
        path: `/tables/${mockTableId}/columns/${mockColumnId}/comment`,
      },
    ]

    vi.mocked(getChangeStatus).mockReturnValue('removed')

    const result = buildColumnCommentDiffItem(
      mockTableId,
      mockColumnId,
      withCommentBeforeSchema,
      noCommentAfterSchema,
      removeOperations,
    )

    expect(getChangeStatus).toHaveBeenCalledWith({
      tableId: mockTableId,
      columnId: mockColumnId,
      operations: removeOperations,
      pathRegExp: PATH_PATTERNS.COLUMN_COMMENT,
    })
    expect(result).toEqual({
      kind: 'column-comment',
      status: 'removed',
      data: 'Comment to be removed',
      tableId: mockTableId,
      columnId: mockColumnId,
    })
  })

  it('should return ColumnCommentDiffItem with "modified" status when comment is modified', () => {
    vi.mocked(getChangeStatus).mockReturnValue('modified')

    const result = buildColumnCommentDiffItem(
      mockTableId,
      mockColumnId,
      beforeSchema,
      afterSchema,
      mockOperations,
    )

    expect(getChangeStatus).toHaveBeenCalledWith({
      tableId: mockTableId,
      columnId: mockColumnId,
      operations: mockOperations,
      pathRegExp: PATH_PATTERNS.COLUMN_COMMENT,
    })
    expect(result).toEqual({
      kind: 'column-comment',
      status: 'modified',
      data: 'Updated comment',
      tableId: mockTableId,
      columnId: mockColumnId,
    })
  })

  it('should return null when comment is not changed', () => {
    const unchangedSchema: Schema = structuredClone(baseSchema)
    if (unchangedSchema.tables[mockTableId]?.columns[mockColumnId]) {
      unchangedSchema.tables[mockTableId].columns[mockColumnId].comment =
        'Unchanged comment'
    }

    const noOperations: Operation[] = []

    vi.mocked(getChangeStatus).mockReturnValue('unchanged')

    const result = buildColumnCommentDiffItem(
      mockTableId,
      mockColumnId,
      unchangedSchema,
      unchangedSchema,
      noOperations,
    )

    expect(getChangeStatus).toHaveBeenCalledWith({
      tableId: mockTableId,
      columnId: mockColumnId,
      operations: noOperations,
      pathRegExp: PATH_PATTERNS.COLUMN_COMMENT,
    })
    expect(result).toBeNull()
  })

  it('should return null when table does not exist', () => {
    const nonExistentTableId = 'nonExistentTable'

    vi.mocked(getChangeStatus).mockReturnValue('added')

    const result = buildColumnCommentDiffItem(
      nonExistentTableId,
      mockColumnId,
      beforeSchema,
      afterSchema,
      mockOperations,
    )

    expect(getChangeStatus).toHaveBeenCalledWith({
      tableId: nonExistentTableId,
      columnId: mockColumnId,
      operations: mockOperations,
      pathRegExp: PATH_PATTERNS.COLUMN_COMMENT,
    })
    expect(result).toBeNull()
  })

  it('should return null when column does not exist', () => {
    const nonExistentColumnId = 'nonExistentColumn'

    vi.mocked(getChangeStatus).mockReturnValue('added')

    const result = buildColumnCommentDiffItem(
      mockTableId,
      nonExistentColumnId,
      beforeSchema,
      afterSchema,
      mockOperations,
    )

    expect(getChangeStatus).toHaveBeenCalledWith({
      tableId: mockTableId,
      columnId: nonExistentColumnId,
      operations: mockOperations,
      pathRegExp: PATH_PATTERNS.COLUMN_COMMENT,
    })
    expect(result).toBeNull()
  })
})
