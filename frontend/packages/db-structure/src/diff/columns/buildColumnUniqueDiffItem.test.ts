import type { Operation } from 'fast-json-patch'
import { describe, expect, it, vi } from 'vitest'
import { PATH_PATTERNS } from '../../../operation/constants.js'
import type { Schema } from '../../../schema/index.js'
import { getChangeStatus } from '../../utils/getChangeStatus.js'
import { buildColumnUniqueDiffItem } from './buildColumnUniqueDiffItem.js'

vi.mock('../../utils/getChangeStatus.ts', () => ({
  getChangeStatus: vi.fn(),
}))

describe('buildColumnUniqueDiffItem', () => {
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
  }

  const beforeSchema: Schema = structuredClone(baseSchema)
  if (beforeSchema.tables[mockTableId]?.columns[mockColumnId]) {
    beforeSchema.tables[mockTableId].columns[mockColumnId].unique = false
  }

  const afterSchema: Schema = structuredClone(baseSchema)
  if (afterSchema.tables[mockTableId]?.columns[mockColumnId]) {
    afterSchema.tables[mockTableId].columns[mockColumnId].unique = true
  }

  const mockOperations: Operation[] = [
    {
      op: 'replace',
      path: `/tables/${mockTableId}/columns/${mockColumnId}/unique`,
      value: true,
    },
  ]

  it('should return ColumnUniqueDiffItem with "added" status when unique constraint is added', () => {
    const noUniqueBeforeSchema: Schema = structuredClone(baseSchema)
    if (noUniqueBeforeSchema.tables[mockTableId]?.columns[mockColumnId]) {
      noUniqueBeforeSchema.tables[mockTableId].columns[mockColumnId].unique =
        false
    }

    const uniqueAfterSchema: Schema = structuredClone(baseSchema)
    if (uniqueAfterSchema.tables[mockTableId]?.columns[mockColumnId]) {
      uniqueAfterSchema.tables[mockTableId].columns[mockColumnId].unique = true
    }

    const addOperations: Operation[] = [
      {
        op: 'add',
        path: `/tables/${mockTableId}/columns/${mockColumnId}/unique`,
        value: true,
      },
    ]

    vi.mocked(getChangeStatus).mockReturnValue('added')

    const result = buildColumnUniqueDiffItem(
      mockTableId,
      mockColumnId,
      noUniqueBeforeSchema,
      uniqueAfterSchema,
      addOperations,
    )

    expect(getChangeStatus).toHaveBeenCalledWith({
      tableId: mockTableId,
      columnId: mockColumnId,
      operations: addOperations,
      pathRegExp: PATH_PATTERNS.COLUMN_UNIQUE,
    })
    expect(result).toEqual({
      kind: 'column-unique',
      status: 'added',
      data: true,
      tableId: mockTableId,
      columnId: mockColumnId,
    })
  })

  it('should return ColumnUniqueDiffItem with "removed" status when unique constraint is removed', () => {
    const uniqueBeforeSchema: Schema = structuredClone(baseSchema)
    if (uniqueBeforeSchema.tables[mockTableId]?.columns[mockColumnId]) {
      uniqueBeforeSchema.tables[mockTableId].columns[mockColumnId].unique = true
    }

    const noUniqueAfterSchema: Schema = structuredClone(baseSchema)
    if (noUniqueAfterSchema.tables[mockTableId]?.columns[mockColumnId]) {
      noUniqueAfterSchema.tables[mockTableId].columns[mockColumnId].unique =
        false
    }

    const removeOperations: Operation[] = [
      {
        op: 'remove',
        path: `/tables/${mockTableId}/columns/${mockColumnId}/unique`,
      },
    ]

    vi.mocked(getChangeStatus).mockReturnValue('removed')

    const result = buildColumnUniqueDiffItem(
      mockTableId,
      mockColumnId,
      uniqueBeforeSchema,
      noUniqueAfterSchema,
      removeOperations,
    )

    expect(getChangeStatus).toHaveBeenCalledWith({
      tableId: mockTableId,
      columnId: mockColumnId,
      operations: removeOperations,
      pathRegExp: PATH_PATTERNS.COLUMN_UNIQUE,
    })
    expect(result).toEqual({
      kind: 'column-unique',
      status: 'removed',
      data: true,
      tableId: mockTableId,
      columnId: mockColumnId,
    })
  })

  it('should return ColumnUniqueDiffItem with "modified" status when unique constraint is modified', () => {
    vi.mocked(getChangeStatus).mockReturnValue('modified')

    const result = buildColumnUniqueDiffItem(
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
      pathRegExp: PATH_PATTERNS.COLUMN_UNIQUE,
    })
    expect(result).toEqual({
      kind: 'column-unique',
      status: 'modified',
      data: true,
      tableId: mockTableId,
      columnId: mockColumnId,
    })
  })

  it('should return null when unique constraint is not changed', () => {
    const unchangedSchema: Schema = structuredClone(baseSchema)
    if (unchangedSchema.tables[mockTableId]?.columns[mockColumnId]) {
      unchangedSchema.tables[mockTableId].columns[mockColumnId].unique = false
    }

    const noOperations: Operation[] = []

    vi.mocked(getChangeStatus).mockReturnValue('unchanged')

    const result = buildColumnUniqueDiffItem(
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
      pathRegExp: PATH_PATTERNS.COLUMN_UNIQUE,
    })
    expect(result).toBeNull()
  })

  it('should return null when table does not exist', () => {
    const nonExistentTableId = 'nonExistentTable'

    vi.mocked(getChangeStatus).mockReturnValue('added')

    const result = buildColumnUniqueDiffItem(
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
      pathRegExp: PATH_PATTERNS.COLUMN_UNIQUE,
    })
    expect(result).toBeNull()
  })

  it('should return null when column does not exist', () => {
    const nonExistentColumnId = 'nonExistentColumn'

    vi.mocked(getChangeStatus).mockReturnValue('added')

    const result = buildColumnUniqueDiffItem(
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
      pathRegExp: PATH_PATTERNS.COLUMN_UNIQUE,
    })
    expect(result).toBeNull()
  })
})
