import type { Operation } from 'fast-json-patch'
import { describe, expect, it, vi } from 'vitest'
import type { Schema } from '../../../schema/index.js'
import { PATH_PATTERNS } from '../../constants.js'
import { getChangeStatus } from '../../utils/getChangeStatus.js'
import { buildColumnCheckDiffItem } from '../buildColumnCheckDiffItem.js'

vi.mock('../../utils/getChangeStatus.ts', () => ({
  getChangeStatus: vi.fn(),
}))

describe('buildColumnCheckDiffItem', () => {
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
    relationships: {},
    tableGroups: {},
  }

  const beforeSchema: Schema = structuredClone(baseSchema)
  if (beforeSchema.tables[mockTableId]?.columns[mockColumnId]) {
    beforeSchema.tables[mockTableId].columns[mockColumnId].check = null
  }

  const afterSchema: Schema = structuredClone(baseSchema)
  if (afterSchema.tables[mockTableId]?.columns[mockColumnId]) {
    afterSchema.tables[mockTableId].columns[mockColumnId].check = 'value > 0'
  }

  const mockOperations: Operation[] = [
    {
      op: 'replace',
      path: `/tables/${mockTableId}/columns/${mockColumnId}/check`,
      value: 'value > 0',
    },
  ]

  it('should return ColumnCheckDiffItem with "added" status when check constraint is added', () => {
    const noCheckBeforeSchema: Schema = structuredClone(baseSchema)
    if (noCheckBeforeSchema.tables[mockTableId]?.columns[mockColumnId]) {
      noCheckBeforeSchema.tables[mockTableId].columns[mockColumnId].check = null
    }

    const checkAfterSchema: Schema = structuredClone(baseSchema)
    if (checkAfterSchema.tables[mockTableId]?.columns[mockColumnId]) {
      checkAfterSchema.tables[mockTableId].columns[mockColumnId].check =
        'value > 0'
    }

    const addOperations: Operation[] = [
      {
        op: 'add',
        path: `/tables/${mockTableId}/columns/${mockColumnId}/check`,
        value: 'value > 0',
      },
    ]

    // Set mock return value
    vi.mocked(getChangeStatus).mockReturnValue('added')

    const result = buildColumnCheckDiffItem(
      mockTableId,
      mockColumnId,
      noCheckBeforeSchema,
      checkAfterSchema,
      addOperations,
    )

    expect(getChangeStatus).toHaveBeenCalledWith({
      tableId: mockTableId,
      columnId: mockColumnId,
      operations: addOperations,
      pathRegExp: PATH_PATTERNS.COLUMN_CHECK,
    })
    expect(result).toEqual({
      kind: 'column-check',
      status: 'added',
      data: 'value > 0',
      tableId: mockTableId,
      columnId: mockColumnId,
    })
  })

  it('should return ColumnCheckDiffItem with "removed" status when check constraint is removed', () => {
    const checkBeforeSchema: Schema = structuredClone(baseSchema)
    if (checkBeforeSchema.tables[mockTableId]?.columns[mockColumnId]) {
      checkBeforeSchema.tables[mockTableId].columns[mockColumnId].check =
        'value > 0'
    }

    const noCheckAfterSchema: Schema = structuredClone(baseSchema)
    if (noCheckAfterSchema.tables[mockTableId]?.columns[mockColumnId]) {
      noCheckAfterSchema.tables[mockTableId].columns[mockColumnId].check = null
    }

    const removeOperations: Operation[] = [
      {
        op: 'remove',
        path: `/tables/${mockTableId}/columns/${mockColumnId}/check`,
      },
    ]

    vi.mocked(getChangeStatus).mockReturnValue('removed')

    const result = buildColumnCheckDiffItem(
      mockTableId,
      mockColumnId,
      checkBeforeSchema,
      noCheckAfterSchema,
      removeOperations,
    )

    expect(getChangeStatus).toHaveBeenCalledWith({
      tableId: mockTableId,
      columnId: mockColumnId,
      operations: removeOperations,
      pathRegExp: PATH_PATTERNS.COLUMN_CHECK,
    })
    expect(result).toEqual({
      kind: 'column-check',
      status: 'removed',
      data: 'value > 0',
      tableId: mockTableId,
      columnId: mockColumnId,
    })
  })

  it('should return ColumnCheckDiffItem with "modified" status when check constraint is modified', () => {
    const oldCheckSchema: Schema = structuredClone(baseSchema)
    if (oldCheckSchema.tables[mockTableId]?.columns[mockColumnId]) {
      oldCheckSchema.tables[mockTableId].columns[mockColumnId].check =
        'value >= 0'
    }

    const newCheckSchema: Schema = structuredClone(baseSchema)
    if (newCheckSchema.tables[mockTableId]?.columns[mockColumnId]) {
      newCheckSchema.tables[mockTableId].columns[mockColumnId].check =
        'value > 0'
    }

    const modifyOperations: Operation[] = [
      {
        op: 'replace',
        path: `/tables/${mockTableId}/columns/${mockColumnId}/check`,
        value: 'value > 0',
      },
    ]

    vi.mocked(getChangeStatus).mockReturnValue('modified')

    const result = buildColumnCheckDiffItem(
      mockTableId,
      mockColumnId,
      oldCheckSchema,
      newCheckSchema,
      modifyOperations,
    )

    expect(getChangeStatus).toHaveBeenCalledWith({
      tableId: mockTableId,
      columnId: mockColumnId,
      operations: modifyOperations,
      pathRegExp: PATH_PATTERNS.COLUMN_CHECK,
    })
    expect(result).toEqual({
      kind: 'column-check',
      status: 'modified',
      data: 'value > 0',
      tableId: mockTableId,
      columnId: mockColumnId,
    })
  })

  it('should return null when check constraint is not changed', () => {
    const unchangedSchema: Schema = structuredClone(baseSchema)
    if (unchangedSchema.tables[mockTableId]?.columns[mockColumnId]) {
      unchangedSchema.tables[mockTableId].columns[mockColumnId].check =
        'value > 0'
    }

    const noOperations: Operation[] = []

    vi.mocked(getChangeStatus).mockReturnValue('unchanged')

    const result = buildColumnCheckDiffItem(
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
      pathRegExp: PATH_PATTERNS.COLUMN_CHECK,
    })
    expect(result).toBeNull()
  })

  it('should return null when table does not exist', () => {
    const nonExistentTableId = 'nonExistentTable'

    vi.mocked(getChangeStatus).mockReturnValue('added')

    const result = buildColumnCheckDiffItem(
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
      pathRegExp: PATH_PATTERNS.COLUMN_CHECK,
    })
    expect(result).toBeNull()
  })

  it('should return null when column does not exist', () => {
    const nonExistentColumnId = 'nonExistentColumn'

    vi.mocked(getChangeStatus).mockReturnValue('added')

    const result = buildColumnCheckDiffItem(
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
      pathRegExp: PATH_PATTERNS.COLUMN_CHECK,
    })
    expect(result).toBeNull()
  })
})
