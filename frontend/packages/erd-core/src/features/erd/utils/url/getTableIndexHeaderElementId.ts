import type { Hash } from '../../../../schemas'

export const getTableIndexHeaderElementId = (tableName: string): Hash =>
  `${tableName}__indexes`
