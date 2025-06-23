import type { Operation } from 'fast-json-patch'
import type { Schema } from '../../schema/index.js'
import type { ColumnUniqueDiffItem } from '../types.js'

export function buildColumnUniqueDiffItem(
  _tableId: string,
  _columnId: string,
  _before: Schema,
  _after: Schema,
  _operations: Operation[],
): ColumnUniqueDiffItem | null {
  // TODO: This function is deprecated since column.unique field has been removed.
  // Unique constraints are now tracked through the constraints diff system.
  // This function should be removed or updated to work with constraint changes.
  return null
}
