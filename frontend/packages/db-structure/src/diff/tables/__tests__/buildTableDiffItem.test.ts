import type { Operation } from 'fast-json-patch'
import { describe, expect, it, vi } from 'vitest'
import type { Schema } from '../../../schema/index.js'
import { PATH_PATTERNS } from '../../constants.js'
import { getChangeStatus } from '../../utils/getChangeStatus.js'
import { buildTableDiffItem } from '../buildTableDiffItem.js'

vi.mock('../../utils/getChangeStatus.ts', () => ({
  getChangeStatus: vi.fn(),
}))

describe('buildTableDiffItem', () => {
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
  const afterSchema: Schema = structuredClone(baseSchema)

  const mockOperations: Operation[] = [
    {
      op: 'replace',
      path: `/tables/${mockTableId}`,
      value: {
        name: 'Updated Table',
        columns: {},
        comment: 'Updated comment',
        indexes: {},
        constraints: {},
      },
    },
  ]

  it('should return TableDiffItem with "added" status when table is added', () => {
    // Set mock return value
    vi.mocked(getChangeStatus).mockReturnValue('added')

    const result = buildTableDiffItem(
      mockTableId,
      beforeSchema,
      afterSchema,
      mockOperations,
    )

    expect(getChangeStatus).toHaveBeenCalledWith({
      tableId: mockTableId,
      operations: mockOperations,
      pathRegExp: PATH_PATTERNS.TABLE_BASE,
    })
    expect(result).toEqual({
      kind: 'table',
      status: 'added',
      data: afterSchema.tables[mockTableId],
      tableId: mockTableId,
    })
  })

  it('should return TableDiffItem with "removed" status when table is removed', () => {
    // Set mock return value
    vi.mocked(getChangeStatus).mockReturnValue('removed')

    const result = buildTableDiffItem(
      mockTableId,
      beforeSchema,
      afterSchema,
      mockOperations,
    )

    expect(getChangeStatus).toHaveBeenCalledWith({
      tableId: mockTableId,
      operations: mockOperations,
      pathRegExp: PATH_PATTERNS.TABLE_BASE,
    })
    expect(result).toEqual({
      kind: 'table',
      status: 'removed',
      data: beforeSchema.tables[mockTableId],
      tableId: mockTableId,
    })
  })

  it('should return TableDiffItem with "modified" status when table is modified', () => {
    // Set mock return value
    vi.mocked(getChangeStatus).mockReturnValue('modified')

    const result = buildTableDiffItem(
      mockTableId,
      beforeSchema,
      afterSchema,
      mockOperations,
    )

    expect(getChangeStatus).toHaveBeenCalledWith({
      tableId: mockTableId,
      operations: mockOperations,
      pathRegExp: PATH_PATTERNS.TABLE_BASE,
    })
    expect(result).toEqual({
      kind: 'table',
      status: 'modified',
      data: afterSchema.tables[mockTableId],
      tableId: mockTableId,
    })
  })

  it('should return null when table is not changed', () => {
    // Set mock return value
    vi.mocked(getChangeStatus).mockReturnValue('unchanged')

    const unchangedSchema: Schema = structuredClone(baseSchema)

    const result = buildTableDiffItem(
      mockTableId,
      unchangedSchema,
      unchangedSchema,
      [],
    )

    expect(getChangeStatus).toHaveBeenCalledWith({
      tableId: mockTableId,
      operations: [],
      pathRegExp: PATH_PATTERNS.TABLE_BASE,
    })
    expect(result).toEqual(null)
  })

  it('should return null when table does not exist', () => {
    const nonExistentTableId = 'nonExistentTable'

    // Set mock return value
    vi.mocked(getChangeStatus).mockReturnValue('added')

    const result = buildTableDiffItem(
      nonExistentTableId,
      beforeSchema,
      afterSchema,
      mockOperations,
    )

    expect(getChangeStatus).toHaveBeenCalledWith({
      tableId: nonExistentTableId,
      operations: mockOperations,
      pathRegExp: PATH_PATTERNS.TABLE_BASE,
    })
    expect(result).toBeNull()
  })
})
