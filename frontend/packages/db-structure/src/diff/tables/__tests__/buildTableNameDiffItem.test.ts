import type { Operation } from 'fast-json-patch'
import { describe, expect, it, vi } from 'vitest'
import type { Schema } from '../../../schema/index.js'
import { PATH_PATTERNS } from '../../constants.js'
import { getChangeStatus } from '../../utils/getChangeStatus.js'
import { buildTableNameDiffItem } from '../buildTableNameDiffItem.js'

vi.mock('../../utils/getChangeStatus.ts', () => ({
  getChangeStatus: vi.fn(),
}))

describe('buildTableNameDiffItem', () => {
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
    beforeSchema.tables['table1'].name = 'Previous Table Name'
  }

  const afterSchema: Schema = structuredClone(baseSchema)
  if (afterSchema.tables['table1']) {
    afterSchema.tables['table1'].name = 'Updated Table Name'
  }

  const mockOperations: Operation[] = [
    {
      op: 'replace',
      path: `/tables/${mockTableId}/name`,
      value: 'Updated Table Name',
    },
  ]

  it('should return TableNameDiffItem with "added" status when name is added', () => {
    // Set mock return value
    vi.mocked(getChangeStatus).mockReturnValue('added')

    const result = buildTableNameDiffItem(
      mockTableId,
      beforeSchema,
      afterSchema,
      mockOperations,
    )

    expect(getChangeStatus).toHaveBeenCalledWith({
      tableId: mockTableId,
      operations: mockOperations,
      pathRegExp: PATH_PATTERNS.TABLE_NAME,
    })
    expect(result).toEqual({
      kind: 'table-name',
      status: 'added',
      data: 'Updated Table Name',
      tableId: mockTableId,
    })
  })

  it('should return TableNameDiffItem with "removed" status when name is removed', () => {
    // Set mock return value
    vi.mocked(getChangeStatus).mockReturnValue('removed')

    const result = buildTableNameDiffItem(
      mockTableId,
      beforeSchema,
      afterSchema,
      mockOperations,
    )

    expect(getChangeStatus).toHaveBeenCalledWith({
      tableId: mockTableId,
      operations: mockOperations,
      pathRegExp: PATH_PATTERNS.TABLE_NAME,
    })
    expect(result).toEqual({
      kind: 'table-name',
      status: 'removed',
      data: 'Previous Table Name',
      tableId: mockTableId,
    })
  })

  it('should return TableNameDiffItem with "modified" status when name is modified', () => {
    // Set mock return value
    vi.mocked(getChangeStatus).mockReturnValue('modified')

    const result = buildTableNameDiffItem(
      mockTableId,
      beforeSchema,
      afterSchema,
      mockOperations,
    )

    expect(getChangeStatus).toHaveBeenCalledWith({
      tableId: mockTableId,
      operations: mockOperations,
      pathRegExp: PATH_PATTERNS.TABLE_NAME,
    })
    expect(result).toEqual({
      kind: 'table-name',
      status: 'modified',
      data: 'Updated Table Name',
      tableId: mockTableId,
    })
  })

  it('should return null when name is not changed', () => {
    // Set mock return value
    vi.mocked(getChangeStatus).mockReturnValue('unchanged')

    const unchangedSchema: Schema = structuredClone(baseSchema)

    const result = buildTableNameDiffItem(
      mockTableId,
      unchangedSchema,
      unchangedSchema,
      [],
    )

    expect(getChangeStatus).toHaveBeenCalledWith({
      tableId: mockTableId,
      operations: [],
      pathRegExp: PATH_PATTERNS.TABLE_NAME,
    })
    expect(result).toEqual(null)
  })

  it('should return null when table does not exist', () => {
    const nonExistentTableId = 'nonExistentTable'

    // Set mock return value
    vi.mocked(getChangeStatus).mockReturnValue('added')

    const result = buildTableNameDiffItem(
      nonExistentTableId,
      beforeSchema,
      afterSchema,
      mockOperations,
    )

    expect(getChangeStatus).toHaveBeenCalledWith({
      tableId: nonExistentTableId,
      operations: mockOperations,
      pathRegExp: PATH_PATTERNS.TABLE_NAME,
    })
    expect(result).toBeNull()
  })
})
