import * as v from 'valibot'
import { tableSchema } from '../../schema/index.js'
import { PATH_PATTERNS } from '../constants.js'
import { createPathValidator } from '../pathValidators.js'
import type { Operation } from './index.js'

const isTablePath = createPathValidator(PATH_PATTERNS.TABLE_BASE)

const addTableOperationSchema = v.object({
  op: v.literal('add'),
  path: v.custom<`/tables/${string}`>(
    isTablePath,
    'Path must match the pattern /tables/{tableName}',
  ),
  value: tableSchema,
})

export type AddTableOperation = v.InferOutput<typeof addTableOperationSchema>

export const isAddTableOperation = (
  operation: Operation,
): operation is AddTableOperation => {
  return v.safeParse(addTableOperationSchema, operation).success
}

export const tableOperations = [addTableOperationSchema]
