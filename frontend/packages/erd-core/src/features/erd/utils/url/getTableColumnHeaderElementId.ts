import type { Hash } from '../../../../schemas'

export const getTableColumnHeaderElementId = (tableName: string): Hash =>
  `${tableName}__columns`
