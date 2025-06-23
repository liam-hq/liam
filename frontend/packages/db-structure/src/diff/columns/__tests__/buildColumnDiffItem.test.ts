import type { Operation } from 'fast-json-patch'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PATH_PATTERNS } from '../../../operation/constants.js'
import type { Column, Schema } from '../../../schema/index.js'
import { getChangeStatus } from '../../utils/getChangeStatus.js'
import { buildColumnDiffItem } from '../buildColumnDiffItem.js'

vi.mock('../../utils/getChangeStatus.ts', () => ({
  getChangeStatus: vi.fn(),
}))

describe('buildColumnDiffItem', () => {
  const mockTableId = 'table1'
  const mockColumnId = 'column1'

  const baseColumn: Column = {
    name: 'Column 1',
    type: 'text',
    default: null,
    check: null,
    primary: false,
    notNull: false,
    comment: null,
  }

  const createMockSchema = (
    tableConfig: {
      includeTable?: boolean
      tableId?: string
      columns?: Record<string, Column>
    } = {},
  ): Schema => {
    const {
      includeTable = true,
      tableId = mockTableId,
      columns = {},
    } = tableConfig

    const schema: Schema = {
      tables: {},
      relationships: {},
      tableGroups: {},
    }

    if (includeTable) {
      schema.tables[tableId] = {
        name: 'Table 1',
        columns,
        comment: null,
        indexes: {},
        constraints: {},
      }
    }

    return schema
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return ColumnDiffItem with "added" status when column is added', () => {
    const addedColumn = { ...baseColumn, name: 'New Column' }

    const beforeSchema = createMockSchema({
      columns: {},
    })

    const afterSchema = createMockSchema({
      columns: { [mockColumnId]: addedColumn },
    })

    const addOperations: Operation[] = [
      {
        op: 'add',
        path: `/tables/${mockTableId}/columns/${mockColumnId}`,
        value: addedColumn,
      },
    ]

    vi.mocked(getChangeStatus).mockReturnValue('added')

    const result = buildColumnDiffItem(
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
      pathRegExp: PATH_PATTERNS.COLUMN_BASE,
    })
    expect(result).toEqual({
      kind: 'column',
      status: 'added',
      data: addedColumn,
      tableId: mockTableId,
      columnId: mockColumnId,
    })
  })

  it('should return ColumnDiffItem with "removed" status when column is removed', () => {
    const removedColumn = { ...baseColumn, name: 'Column To Remove' }

    const beforeSchema = createMockSchema({
      columns: { [mockColumnId]: removedColumn },
    })

    const afterSchema = createMockSchema({
      columns: {},
    })

    const removeOperations: Operation[] = [
      {
        op: 'remove',
        path: `/tables/${mockTableId}/columns/${mockColumnId}`,
      },
    ]

    vi.mocked(getChangeStatus).mockReturnValue('removed')

    const result = buildColumnDiffItem(
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
      pathRegExp: PATH_PATTERNS.COLUMN_BASE,
    })
    expect(result).toEqual({
      kind: 'column',
      status: 'removed',
      data: removedColumn,
      tableId: mockTableId,
      columnId: mockColumnId,
    })
  })

  it('should return ColumnDiffItem with "modified" status when column is modified', () => {
    const oldColumn = {
      ...baseColumn,
      name: 'Old Column Name',
      type: 'varchar',
    }

    const newColumn = {
      ...baseColumn,
      name: 'New Column Name',
      type: 'text',
    }

    const beforeSchema = createMockSchema({
      columns: { [mockColumnId]: oldColumn },
    })

    const afterSchema = createMockSchema({
      columns: { [mockColumnId]: newColumn },
    })

    const modifyOperations: Operation[] = [
      {
        op: 'replace',
        path: `/tables/${mockTableId}/columns/${mockColumnId}`,
        value: newColumn,
      },
    ]

    vi.mocked(getChangeStatus).mockReturnValue('modified')

    const result = buildColumnDiffItem(
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
      pathRegExp: PATH_PATTERNS.COLUMN_BASE,
    })
    expect(result).toEqual({
      kind: 'column',
      status: 'modified',
      data: newColumn,
      tableId: mockTableId,
      columnId: mockColumnId,
    })
  })

  it('should return null when column is not changed', () => {
    const sameColumn = { ...baseColumn, name: 'Unchanged Column' }
    const unchangedSchema = createMockSchema({
      columns: { [mockColumnId]: sameColumn },
    })

    const noOperations: Operation[] = []

    vi.mocked(getChangeStatus).mockReturnValue('unchanged')

    const result = buildColumnDiffItem(
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
      pathRegExp: PATH_PATTERNS.COLUMN_BASE,
    })
    expect(result).toBeNull()
  })

  it('should return null when table does not exist', () => {
    const beforeSchema = createMockSchema()
    const afterSchema = createMockSchema()

    const nonExistentTableId = 'nonExistentTable'

    const mockOperations: Operation[] = []

    vi.mocked(getChangeStatus).mockReturnValue('added')

    const result = buildColumnDiffItem(
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
      pathRegExp: PATH_PATTERNS.COLUMN_BASE,
    })
    expect(result).toBeNull()
  })

  it('should return null when column does not exist', () => {
    const beforeSchema = createMockSchema({ columns: {} })
    const afterSchema = createMockSchema({ columns: {} })

    const nonExistentColumnId = 'nonExistentColumn'

    const mockOperations: Operation[] = []

    vi.mocked(getChangeStatus).mockReturnValue('added')

    const result = buildColumnDiffItem(
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
      pathRegExp: PATH_PATTERNS.COLUMN_BASE,
    })
    expect(result).toBeNull()
  })
})
