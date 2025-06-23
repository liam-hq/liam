import type { Operation } from 'fast-json-patch'
import { describe, expect, it } from 'vitest'
import type { Schema } from '../../../schema/index.js'
import { buildColumnUniqueDiffItem } from '../buildColumnUniqueDiffItem.js'

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

  it('should return null since column.unique field has been removed', () => {
    const mockOperations: Operation[] = [
      {
        op: 'replace',
        path: `/tables/${mockTableId}/columns/${mockColumnId}/unique`,
        value: true,
      },
    ]

    const result = buildColumnUniqueDiffItem(
      mockTableId,
      mockColumnId,
      baseSchema,
      baseSchema,
      mockOperations,
    )

    // The function should return null since column.unique field has been removed
    // and unique constraints are now tracked through the constraints diff system
    expect(result).toBeNull()
  })
})
