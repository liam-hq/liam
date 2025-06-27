import type { Operation } from 'fast-json-patch'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PATH_PATTERNS } from '../../../operation/constants.js'
import type { Schema } from '../../../schema/index.js'
import { getChangeStatus } from '../../utils/getChangeStatus.js'
import { buildColumnNotNullDiffItem } from '../buildColumnNotNullDiffItem.js'

vi.mock('../../utils/getChangeStatus.ts', () => ({
  getChangeStatus: vi.fn(),
}))

describe('buildColumnNotNullDiffItem', () => {
  const mockTableId = 'table1'
  const mockColumnId = 'column1'

  const baseColumn = {
    name: 'Column 1',
    type: 'text',
    default: null,
    check: null,
    notNull: false,
    comment: null,
  }

  const createMockSchema = (
    includeColumn = true,
    notNullValue = false,
  ): Schema => {
    const schema: Schema = {
      tables: {},
    }

    schema.tables[mockTableId] = {
      name: 'Table 1',
      columns: {},
      comment: null,
      indexes: {},
      constraints: {},
    }

    if (includeColumn) {
      schema.tables[mockTableId].columns[mockColumnId] = {
        ...baseColumn,
        notNull: notNullValue,
      }
    }

    return schema
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return ColumnNotNullDiffItem with "added" status when notNull constraint is added', () => {
    const beforeSchema = createMockSchema(true, false)
    const afterSchema = createMockSchema(true, true)

    const addOperations: Operation[] = [
      {
        op: 'add',
        path: `/tables/${mockTableId}/columns/${mockColumnId}/notNull`,
        value: true,
      },
    ]

    vi.mocked(getChangeStatus).mockReturnValue('added')

    const result = buildColumnNotNullDiffItem(
      mockTableId,
      mockColumnId,
      beforeSchema,
      afterSchema,
      addOperations,
    )

    expect(getChangeStatus).toHaveBeenCalledWith({
      tableId: mockTableId,
      columnId: mockColumnId,
      operations: addOperations,
      pathRegExp: PATH_PATTERNS.COLUMN_NOT_NULL,
    })
    expect(result).toEqual({
      kind: 'column-not-null',
      status: 'added',
      data: true,
      tableId: mockTableId,
      columnId: mockColumnId,
    })
  })

  it('should return ColumnNotNullDiffItem with "removed" status when notNull constraint is removed', () => {
    const beforeSchema = createMockSchema(true, true)
    const afterSchema = createMockSchema(true, false)

    const removeOperations: Operation[] = [
      {
        op: 'remove',
        path: `/tables/${mockTableId}/columns/${mockColumnId}/notNull`,
      },
    ]

    vi.mocked(getChangeStatus).mockReturnValue('removed')

    const result = buildColumnNotNullDiffItem(
      mockTableId,
      mockColumnId,
      beforeSchema,
      afterSchema,
      removeOperations,
    )

    expect(getChangeStatus).toHaveBeenCalledWith({
      tableId: mockTableId,
      columnId: mockColumnId,
      operations: removeOperations,
      pathRegExp: PATH_PATTERNS.COLUMN_NOT_NULL,
    })
    expect(result).toEqual({
      kind: 'column-not-null',
      status: 'removed',
      data: true,
      tableId: mockTableId,
      columnId: mockColumnId,
    })
  })

  it('should return ColumnNotNullDiffItem with "modified" status when notNull constraint is modified', () => {
    const beforeSchema = createMockSchema(true, false)
    const afterSchema = createMockSchema(true, true)

    const modifyOperations: Operation[] = [
      {
        op: 'replace',
        path: `/tables/${mockTableId}/columns/${mockColumnId}/notNull`,
        value: true,
      },
    ]

    vi.mocked(getChangeStatus).mockReturnValue('modified')

    const result = buildColumnNotNullDiffItem(
      mockTableId,
      mockColumnId,
      beforeSchema,
      afterSchema,
      modifyOperations,
    )

    expect(getChangeStatus).toHaveBeenCalledWith({
      tableId: mockTableId,
      columnId: mockColumnId,
      operations: modifyOperations,
      pathRegExp: PATH_PATTERNS.COLUMN_NOT_NULL,
    })
    expect(result).toEqual({
      kind: 'column-not-null',
      status: 'modified',
      data: true,
      tableId: mockTableId,
      columnId: mockColumnId,
    })
  })

  it('should return null when notNull constraint is not changed', () => {
    const unchangedSchema = createMockSchema(true, true)

    const noOperations: Operation[] = []

    vi.mocked(getChangeStatus).mockReturnValue('unchanged')

    const result = buildColumnNotNullDiffItem(
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
      pathRegExp: PATH_PATTERNS.COLUMN_NOT_NULL,
    })
    expect(result).toBeNull()
  })

  it('should return ColumnNotNullDiffItem with false when notNull value is false', () => {
    const beforeSchema = createMockSchema(true, false)
    const afterSchema = createMockSchema(true, false)

    const mockOperations: Operation[] = []

    vi.mocked(getChangeStatus).mockReturnValue('modified')

    const result = buildColumnNotNullDiffItem(
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
      pathRegExp: PATH_PATTERNS.COLUMN_NOT_NULL,
    })
    expect(result).toEqual({
      kind: 'column-not-null',
      status: 'modified',
      data: false,
      tableId: mockTableId,
      columnId: mockColumnId,
    })
  })

  it('should return null when table does not exist', () => {
    const nonExistentTableId = 'nonExistentTable'
    const beforeSchema = createMockSchema(true, true)
    const afterSchema = createMockSchema(true, true)

    const mockOperations: Operation[] = []

    vi.mocked(getChangeStatus).mockReturnValue('added')

    const result = buildColumnNotNullDiffItem(
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
      pathRegExp: PATH_PATTERNS.COLUMN_NOT_NULL,
    })
    expect(result).toBeNull()
  })

  it('should return null when column does not exist', () => {
    const nonExistentColumnId = 'nonExistentColumn'
    const beforeSchema = createMockSchema(true, true)
    const afterSchema = createMockSchema(true, true)

    const mockOperations: Operation[] = []

    vi.mocked(getChangeStatus).mockReturnValue('added')

    const result = buildColumnNotNullDiffItem(
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
      pathRegExp: PATH_PATTERNS.COLUMN_NOT_NULL,
    })
    expect(result).toBeNull()
  })
})
