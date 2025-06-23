import type { Operation } from 'fast-json-patch'
import { describe, expect, it, vi } from 'vitest'
import { PATH_PATTERNS } from '../../../operation/constants.js'
import type { Schema } from '../../../schema/index.js'
import { getChangeStatus } from '../../utils/getChangeStatus.js'
import { buildColumnDefaultDiffItem } from '../buildColumnDefaultDiffItem.js'

vi.mock('../../utils/getChangeStatus.ts', () => ({
  getChangeStatus: vi.fn(),
}))

describe('buildColumnDefaultDiffItem', () => {
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
    beforeSchema.tables[mockTableId].columns[mockColumnId].default =
      'old_default'
  }

  const afterSchema: Schema = structuredClone(baseSchema)
  if (afterSchema.tables[mockTableId]?.columns[mockColumnId]) {
    afterSchema.tables[mockTableId].columns[mockColumnId].default =
      'new_default'
  }

  const mockOperations: Operation[] = [
    {
      op: 'replace',
      path: `/tables/${mockTableId}/columns/${mockColumnId}/default`,
      value: 'new_default',
    },
  ]

  it('should return ColumnDefaultDiffItem with "added" status when default value is added', () => {
    const noDefaultBeforeSchema: Schema = structuredClone(baseSchema)
    if (noDefaultBeforeSchema.tables[mockTableId]?.columns[mockColumnId]) {
      noDefaultBeforeSchema.tables[mockTableId].columns[mockColumnId].default =
        null
    }

    const withDefaultAfterSchema: Schema = structuredClone(baseSchema)
    if (withDefaultAfterSchema.tables[mockTableId]?.columns[mockColumnId]) {
      withDefaultAfterSchema.tables[mockTableId].columns[mockColumnId].default =
        'default_value'
    }

    const addOperations: Operation[] = [
      {
        op: 'add',
        path: `/tables/${mockTableId}/columns/${mockColumnId}/default`,
        value: 'default_value',
      },
    ]

    vi.mocked(getChangeStatus).mockReturnValue('added')

    const result = buildColumnDefaultDiffItem(
      mockTableId,
      mockColumnId,
      noDefaultBeforeSchema,
      withDefaultAfterSchema,
      addOperations,
    )

    expect(getChangeStatus).toHaveBeenCalledWith({
      tableId: mockTableId,
      columnId: mockColumnId,
      operations: addOperations,
      pathRegExp: PATH_PATTERNS.COLUMN_DEFAULT,
    })
    expect(result).toEqual({
      kind: 'column-default',
      status: 'added',
      data: 'default_value',
      tableId: mockTableId,
      columnId: mockColumnId,
    })
  })

  it('should return ColumnDefaultDiffItem with "removed" status when default value is removed', () => {
    const withDefaultBeforeSchema: Schema = structuredClone(baseSchema)
    if (withDefaultBeforeSchema.tables[mockTableId]?.columns[mockColumnId]) {
      withDefaultBeforeSchema.tables[mockTableId].columns[
        mockColumnId
      ].default = 'default_to_remove'
    }

    const noDefaultAfterSchema: Schema = structuredClone(baseSchema)
    if (noDefaultAfterSchema.tables[mockTableId]?.columns[mockColumnId]) {
      noDefaultAfterSchema.tables[mockTableId].columns[mockColumnId].default =
        null
    }

    const removeOperations: Operation[] = [
      {
        op: 'remove',
        path: `/tables/${mockTableId}/columns/${mockColumnId}/default`,
      },
    ]

    vi.mocked(getChangeStatus).mockReturnValue('removed')

    const result = buildColumnDefaultDiffItem(
      mockTableId,
      mockColumnId,
      withDefaultBeforeSchema,
      noDefaultAfterSchema,
      removeOperations,
    )

    expect(getChangeStatus).toHaveBeenCalledWith({
      tableId: mockTableId,
      columnId: mockColumnId,
      operations: removeOperations,
      pathRegExp: PATH_PATTERNS.COLUMN_DEFAULT,
    })
    expect(result).toEqual({
      kind: 'column-default',
      status: 'removed',
      data: 'default_to_remove',
      tableId: mockTableId,
      columnId: mockColumnId,
    })
  })

  it('should return ColumnDefaultDiffItem with "modified" status when default value is modified', () => {
    // Set mock return value
    vi.mocked(getChangeStatus).mockReturnValue('modified')

    const result = buildColumnDefaultDiffItem(
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
      pathRegExp: PATH_PATTERNS.COLUMN_DEFAULT,
    })
    expect(result).toEqual({
      kind: 'column-default',
      status: 'modified',
      data: 'new_default',
      tableId: mockTableId,
      columnId: mockColumnId,
    })
  })

  it('should return ColumnDefaultDiffItem with numeric default value', () => {
    const numericDefaultSchema: Schema = structuredClone(baseSchema)
    if (numericDefaultSchema.tables[mockTableId]?.columns[mockColumnId]) {
      numericDefaultSchema.tables[mockTableId].columns[mockColumnId].default =
        42
    }

    const numericOperations: Operation[] = [
      {
        op: 'replace',
        path: `/tables/${mockTableId}/columns/${mockColumnId}/default`,
        value: 42,
      },
    ]

    vi.mocked(getChangeStatus).mockReturnValue('added')

    const result = buildColumnDefaultDiffItem(
      mockTableId,
      mockColumnId,
      beforeSchema,
      numericDefaultSchema,
      numericOperations,
    )

    expect(getChangeStatus).toHaveBeenCalledWith({
      tableId: mockTableId,
      columnId: mockColumnId,
      operations: numericOperations,
      pathRegExp: PATH_PATTERNS.COLUMN_DEFAULT,
    })
    expect(result).toEqual({
      kind: 'column-default',
      status: 'added',
      data: 42,
      tableId: mockTableId,
      columnId: mockColumnId,
    })
  })

  it('should return null when default value is not changed', () => {
    const unchangedSchema: Schema = structuredClone(baseSchema)
    if (unchangedSchema.tables[mockTableId]?.columns[mockColumnId]) {
      unchangedSchema.tables[mockTableId].columns[mockColumnId].default =
        'unchanged_default'
    }

    const noOperations: Operation[] = []

    vi.mocked(getChangeStatus).mockReturnValue('unchanged')

    const result = buildColumnDefaultDiffItem(
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
      pathRegExp: PATH_PATTERNS.COLUMN_DEFAULT,
    })
    expect(result).toBeNull()
  })

  it('should return null when table does not exist', () => {
    const nonExistentTableId = 'nonExistentTable'

    vi.mocked(getChangeStatus).mockReturnValue('added')

    const result = buildColumnDefaultDiffItem(
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
      pathRegExp: PATH_PATTERNS.COLUMN_DEFAULT,
    })
    expect(result).toBeNull()
  })

  it('should return null when column does not exist', () => {
    const nonExistentColumnId = 'nonExistentColumn'

    vi.mocked(getChangeStatus).mockReturnValue('added')

    const result = buildColumnDefaultDiffItem(
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
      pathRegExp: PATH_PATTERNS.COLUMN_DEFAULT,
    })
    expect(result).toBeNull()
  })
})
