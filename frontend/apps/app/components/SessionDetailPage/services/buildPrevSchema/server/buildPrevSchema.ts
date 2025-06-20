import type { Schema } from '@liam-hq/db-structure'
import { createClient } from '@/libs/db/server'
import { fetchVersionById } from '../fetchVersionById'
import { rollbackSchema } from '../rollbackSchema'

type Params = {
  currentSchema: Schema
  currentVersionId: string
}

export async function buildPrevSchema({
  currentSchema,
  currentVersionId,
}: Params) {
  const supabase = await createClient()
  const version = await fetchVersionById(supabase, currentVersionId)
  if (!version) return null

  return await rollbackSchema(currentSchema, version.reverse_patch)
}
