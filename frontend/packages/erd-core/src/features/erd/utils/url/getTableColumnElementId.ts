import type { Hash } from '../../../../schemas'

export const getTableColumnElementId = (
  tableName: string,
  columnName: string,
): Hash => `${tableName}__columns__${columnName}`
