import type { Tables } from '@liam-hq/db'
import {
  applyPatchOperations,
  operationsSchema,
  type Schema,
} from '@liam-hq/db-structure'
import { safeParse } from 'valibot'

export async function rollbackSchema(
  currentSchema: Schema,
  reversePatch: Tables<'building_schema_versions'>['reverse_patch'],
) {
  const parsed = safeParse(operationsSchema, reversePatch)
  if (!parsed.success) return null

  const prev: Schema = structuredClone(currentSchema)
  applyPatchOperations(prev, parsed.output)

  return prev
}
