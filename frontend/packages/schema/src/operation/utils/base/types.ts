import type { Operation } from '../../schema/index.js'

/**
 * Base type for schema change detection parameters
 */
export type BaseChangeParams = {
  operations: Operation[]
}

/**
 * Parameters for table-level schema change detection
 */
export type TableChangeParams = BaseChangeParams & {
  tableId: string
}

/**
 * Parameters for column-level schema change detection
 */
export type ColumnChangeParams = TableChangeParams & {
  columnId: string
}

/**
 * Parameters for index-level schema change detection
 */
export type IndexChangeParams = TableChangeParams & {
  indexId: string
}

/**
 * Parameters for constraint-level schema change detection
 */
export type ConstraintChangeParams = TableChangeParams & {
  constraintId: string
}

/**
 * Parameters for optional column-level schema change detection
 */
export type OptionalColumnChangeParams = TableChangeParams & {
  columnId?: string
}

/**
 * Parameters for optional index-level schema change detection
 */
export type OptionalIndexChangeParams = TableChangeParams & {
  indexId?: string
}

/**
 * Parameters for optional constraint-level schema change detection
 */
export type OptionalConstraintChangeParams = TableChangeParams & {
  constraintId?: string
}
