import type { Hash } from '../../../../schemas'

export const getTableIndexElementId = (
  tableName: string,
  indexName: string,
): Hash => `${tableName}__indexes__${indexName}`
