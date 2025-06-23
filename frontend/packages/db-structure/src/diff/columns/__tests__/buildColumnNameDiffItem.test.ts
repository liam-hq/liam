import type { Operation } from 'fast-json-patch'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PATH_PATTERNS } from '../../../operation/constants.js'
import type { Schema } from '../../../schema/index.js'
import { getChangeStatus } from '../../utils/getChangeStatus.js'
import { buildColumnNameDiffItem } from '../buildColumnNameDiffItem.js'

vi.mock('../../utils/getChangeStatus.ts', () => ({
  getChangeStatus: vi.fn(),
}))

describe('buildColumnNameDiffItem', () => {
  const mockTableId = 'table1'
  const mockColumnId = 'column1'

  const baseColumn = {
    name: 'Column 1',
    type: 'text',
    default: null,
    check: null,
    primary: false,
    notNull: false,
    comment: null,
    unique: false,
  }

  const createMockSchema = (
    includeColumn = true,
    columnName = 'Column 1',
  ): Schema => {
    const schema: Schema = {
      tables: {},
      tableGroups: {},
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
        name: columnName,
      }
    }

    return schema
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return ColumnNameDiffItem with "added" status when column name is added', () => {
    const beforeSchema = createMockSchema(true, '')
    const afterSchema = createMockSchema(true, 'New Column Name')

    const addOperations: Operation[] = [
      {
        op: 'add',
        path: `/tables/${mockTableId}/columns/${mockColumnId}/name`,
        value: 'New Column Name',
      },
    ]

    vi.mocked(getChangeStatus).mockReturnValue('added')

    const result = buildColumnNameDiffItem(
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
      pathRegExp: PATH_PATTERNS.COLUMN_NAME,
    })
    expect(result).toEqual({
      kind: 'column-name',
      status: 'added',
      data: 'New Column Name',
      tableId: mockTableId,
      columnId: mockColumnId,
    })
  })

  it('should return ColumnNameDiffItem with "removed" status when column name is removed', () => {
    const beforeSchema = createMockSchema(true, 'Column Name To Remove')
    const afterSchema = createMockSchema(true, '')

    const removeOperations: Operation[] = [
      {
        op: 'remove',
        path: `/tables/${mockTableId}/columns/${mockColumnId}/name`,
      },
    ]

    vi.mocked(getChangeStatus).mockReturnValue('removed')

    const result = buildColumnNameDiffItem(
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
      pathRegExp: PATH_PATTERNS.COLUMN_NAME,
    })
    expect(result).toEqual({
      kind: 'column-name',
      status: 'removed',
      data: 'Column Name To Remove',
      tableId: mockTableId,
      columnId: mockColumnId,
    })
  })

  it('should return ColumnNameDiffItem with "modified" status when column name is modified', () => {
    const beforeSchema = createMockSchema(true, 'Old Column Name')
    const afterSchema = createMockSchema(true, 'New Column Name')

    const modifyOperations: Operation[] = [
      {
        op: 'replace',
        path: `/tables/${mockTableId}/columns/${mockColumnId}/name`,
        value: 'New Column Name',
      },
    ]

    vi.mocked(getChangeStatus).mockReturnValue('modified')

    const result = buildColumnNameDiffItem(
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
      pathRegExp: PATH_PATTERNS.COLUMN_NAME,
    })
    expect(result).toEqual({
      kind: 'column-name',
      status: 'modified',
      data: 'New Column Name',
      tableId: mockTableId,
      columnId: mockColumnId,
    })
  })

  it('should return null when column name is not changed', () => {
    const unchangedSchema = createMockSchema(true, 'Unchanged Column Name')

    const noOperations: Operation[] = []

    vi.mocked(getChangeStatus).mockReturnValue('unchanged')

    const result = buildColumnNameDiffItem(
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
      pathRegExp: PATH_PATTERNS.COLUMN_NAME,
    })
    expect(result).toBeNull()
  })

  it('should return column ColumnNameDiffItem with empty name when column name is empty', () => {
    const beforeSchema = createMockSchema(true, '')
    const afterSchema = createMockSchema(true, '')

    const mockOperations: Operation[] = []

    vi.mocked(getChangeStatus).mockReturnValue('modified')

    const result = buildColumnNameDiffItem(
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
      pathRegExp: PATH_PATTERNS.COLUMN_NAME,
    })
    expect(result).toEqual({
      kind: 'column-name',
      columnId: 'column1',
      data: '',
      status: 'modified',
      tableId: 'table1',
    })
  })

  it('should return null when table does not exist', () => {
    const nonExistentTableId = 'nonExistentTable'
    const beforeSchema = createMockSchema(true, 'Column Name')
    const afterSchema = createMockSchema(true, 'Column Name')

    const mockOperations: Operation[] = []

    vi.mocked(getChangeStatus).mockReturnValue('added')

    const result = buildColumnNameDiffItem(
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
      pathRegExp: PATH_PATTERNS.COLUMN_NAME,
    })
    expect(result).toBeNull()
  })

  it('should return null when column does not exist', () => {
    const nonExistentColumnId = 'nonExistentColumn'
    const beforeSchema = createMockSchema(true, 'Column Name')
    const afterSchema = createMockSchema(true, 'Column Name')

    const mockOperations: Operation[] = []

    vi.mocked(getChangeStatus).mockReturnValue('added')

    const result = buildColumnNameDiffItem(
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
      pathRegExp: PATH_PATTERNS.COLUMN_NAME,
    })
    expect(result).toBeNull()
  })
})
