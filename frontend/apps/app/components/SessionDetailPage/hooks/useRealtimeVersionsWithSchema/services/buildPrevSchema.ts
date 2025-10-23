'use client'

import { type Schema, schemaSchema } from '@liam-hq/schema'
import * as v from 'valibot'
import { createClient } from '../../../../../libs/db/client'

type Params = {
  currentSchema: Schema
  targetVersionId: string
  buildingSchemaId: string
}

export async function buildPrevSchema({
  currentSchema,
  targetVersionId,
  buildingSchemaId,
}: Params) {
  const supabase = createClient()

  const { data: targetVersion, error: versionError } = await supabase
    .from('building_schema_versions')
    .select('number')
    .eq('id', targetVersionId)
    .single()

  if (versionError || !targetVersion) return null

  if (targetVersion.number === 0) {
    return currentSchema
  }

  const { data: buildingSchema, error } = await supabase
    .from('building_schemas')
    .select('initial_schema_snapshot')
    .eq('id', buildingSchemaId)
    .single()

  if (error || !buildingSchema) return null

  const parsed = v.safeParse(
    schemaSchema,
    buildingSchema.initial_schema_snapshot,
  )
  if (!parsed.success) return null

  return parsed.output
}
