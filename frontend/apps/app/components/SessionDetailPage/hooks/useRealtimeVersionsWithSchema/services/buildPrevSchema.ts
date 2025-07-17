'use client'

import {
  applyPatchOperations,
  operationsSchema,
  type Schema,
} from '@liam-hq/db-structure'
import * as v from 'valibot'
import { createClient } from '@/libs/db/client'

type Params = {
  currentSchema: Schema
  targetVersionId: string
}

export async function buildPrevSchema({
  currentSchema,
  targetVersionId,
}: Params) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('building_schema_versions')
    .select('reverse_patch')
    .eq('id', targetVersionId)
    .single()

  if (error) return null

  const parsed = v.safeParse(operationsSchema, data.reverse_patch)
  if (!parsed.success) return null

  const prevSchema: Schema = structuredClone(currentSchema)
  applyPatchOperations(prevSchema, parsed.output)

  return prevSchema
}
