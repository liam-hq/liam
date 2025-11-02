import type { Hash } from '../../../../schemas'

export const getTableConstraintHeaderElementId = (tableName: string): Hash =>
  `${tableName}__constraints`
