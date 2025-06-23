import type { Operation } from 'fast-json-patch'
import { describe, expect, it, vi } from 'vitest'
import { PATH_PATTERNS } from '../../../operation/constants.js'
import type { Schema } from '../../../schema/index.js'
import { getChangeStatus } from '../../utils/getChangeStatus.js'
import { buildColumnPrimaryDiffItem } from '../buildColumnPrimaryDiffItem.js'

vi.mock('../../utils/getChangeStatus.ts', () => ({
  getChangeStatus: vi.fn(),
}))

describe('buildColumnPrimaryDiffItem', () => {
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
    beforeSchema.tables[mockTableId].columns[mockColumnId].primary = false
  }

  const afterSchema: Schema = structuredClone(baseSchema)
  if (afterSchema.tables[mockTableId]?.columns[mockColumnId]) {
    afterSchema.tables[mockTableId].columns[mockColumnId].primary = true
  }

  const mockOperations: Operation[] = [
    {
      op: 'replace',
      path: `/tables/${mockTableId}/columns/${mockColumnId}/primary`,
      value: true,
    },
  ]

  it('should return ColumnPrimaryDiffItem with "added" status when primary constraint is added', () => {
    const noPrimaryBeforeSchema: Schema = structuredClone(baseSchema)
    if (noPrimaryBeforeSchema.tables[mockTableId]?.columns[mockColumnId]) {
      noPrimaryBeforeSchema.tables[mockTableId].columns[mockColumnId].primary =
        false
    }

    const primaryAfterSchema: Schema = structuredClone(baseSchema)
    if (primaryAfterSchema.tables[mockTableId]?.columns[mockColumnId]) {
      primaryAfterSchema.tables[mockTableId].columns[mockColumnId].primary =
        true
    }

    const addOperations: Operation[] = [
      {
        op: 'add',
        path: `/tables/${mockTableId}/columns/${mockColumnId}/primary`,
        value: true,
      },
    ]

    vi.mocked(getChangeStatus).mockReturnValue('added')

    const result = buildColumnPrimaryDiffItem(
      mockTableId,
      mockColumnId,
      noPrimaryBeforeSchema,
      primaryAfterSchema,
      addOperations,
    )

    expect(getChangeStatus).toHaveBeenCalledWith({
      tableId: mockTableId,
      columnId: mockColumnId,
      operations: addOperations,
      pathRegExp: PATH_PATTERNS.COLUMN_PRIMARY,
    })
    expect(result).toEqual({
      kind: 'column-primary',
      status: 'added',
      data: true,
      tableId: mockTableId,
      columnId: mockColumnId,
    })
  })

  it('should return ColumnPrimaryDiffItem with "removed" status when primary constraint is removed', () => {
    const primaryBeforeSchema: Schema = structuredClone(baseSchema)
    if (primaryBeforeSchema.tables[mockTableId]?.columns[mockColumnId]) {
      primaryBeforeSchema.tables[mockTableId].columns[mockColumnId].primary =
        true
    }

    const noPrimaryAfterSchema: Schema = structuredClone(baseSchema)
    if (noPrimaryAfterSchema.tables[mockTableId]?.columns[mockColumnId]) {
      noPrimaryAfterSchema.tables[mockTableId].columns[mockColumnId].primary =
        false
    }

    const removeOperations: Operation[] = [
      {
        op: 'remove',
        path: `/tables/${mockTableId}/columns/${mockColumnId}/primary`,
      },
    ]

    vi.mocked(getChangeStatus).mockReturnValue('removed')

    const result = buildColumnPrimaryDiffItem(
      mockTableId,
      mockColumnId,
      primaryBeforeSchema,
      noPrimaryAfterSchema,
      removeOperations,
    )

    expect(getChangeStatus).toHaveBeenCalledWith({
      tableId: mockTableId,
      columnId: mockColumnId,
      operations: removeOperations,
      pathRegExp: PATH_PATTERNS.COLUMN_PRIMARY,
    })
    expect(result).toEqual({
      kind: 'column-primary',
      status: 'removed',
      data: true,
      tableId: mockTableId,
      columnId: mockColumnId,
    })
  })

  it('should return ColumnPrimaryDiffItem with "modified" status when primary constraint is modified', () => {
    vi.mocked(getChangeStatus).mockReturnValue('modified')

    const result = buildColumnPrimaryDiffItem(
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
      pathRegExp: PATH_PATTERNS.COLUMN_PRIMARY,
    })
    expect(result).toEqual({
      kind: 'column-primary',
      status: 'modified',
      data: true,
      tableId: mockTableId,
      columnId: mockColumnId,
    })
  })

  it('should return null when primary constraint is not changed', () => {
    const unchangedSchema: Schema = structuredClone(baseSchema)
    if (unchangedSchema.tables[mockTableId]?.columns[mockColumnId]) {
      unchangedSchema.tables[mockTableId].columns[mockColumnId].primary = false
    }

    const noOperations: Operation[] = []

    vi.mocked(getChangeStatus).mockReturnValue('unchanged')

    const result = buildColumnPrimaryDiffItem(
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
      pathRegExp: PATH_PATTERNS.COLUMN_PRIMARY,
    })
    expect(result).toBeNull()
  })

  it('should return null when table does not exist', () => {
    const nonExistentTableId = 'nonExistentTable'

    vi.mocked(getChangeStatus).mockReturnValue('added')

    const result = buildColumnPrimaryDiffItem(
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
      pathRegExp: PATH_PATTERNS.COLUMN_PRIMARY,
    })
    expect(result).toBeNull()
  })

  it('should return null when column does not exist', () => {
    const nonExistentColumnId = 'nonExistentColumn'

    vi.mocked(getChangeStatus).mockReturnValue('added')

    const result = buildColumnPrimaryDiffItem(
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
      pathRegExp: PATH_PATTERNS.COLUMN_PRIMARY,
    })
    expect(result).toBeNull()
  })
})
