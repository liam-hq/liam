import * as v from 'valibot'
import { indexSchema } from '../../schema/index.js'
import { PATH_PATTERNS } from '../constants.js'
import { createPathValidator } from '../pathValidators.js'
import type { Operation } from './index.js'

const isIndexPath = createPathValidator(PATH_PATTERNS.INDEX_BASE)

const indexPathSchema = v.custom<`/tables/${string}/indexes/${string}`>(
  isIndexPath,
  'Path must match the pattern /tables/{tableName}/indexes/{indexName}',
)

// Add index operation
const addIndexOperationSchema = v.object({
  op: v.literal('add'),
  path: indexPathSchema,
  value: indexSchema,
})

export type AddIndexOperation = v.InferOutput<typeof addIndexOperationSchema>

export const isAddIndexOperation = (
  operation: Operation,
): operation is AddIndexOperation => {
  return v.safeParse(addIndexOperationSchema, operation).success
}

// Export all index operations
export const indexOperations = [addIndexOperationSchema]
