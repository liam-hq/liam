'use server'

import { isEmptySchema, schemaSchema } from '@liam-hq/schema'
import { safeParse } from 'valibot'
import { createClient } from '../../../libs/db/server'
import type { Version } from '../types'

export async function getVersions(
  buildingSchemaId: string,
): Promise<Version[]> {
  const supabase = await createClient()
  const { data: versions } = await supabase
    .from('building_schema_versions')
    .select(`
      id,
      building_schema_id,
      number,
      patch,
      reverse_patch,
      building_schemas (
        id,
        schema
      )
    `)
    .eq('building_schema_id', buildingSchemaId)
    .order('number', { ascending: false })

  // Check initial_schema_snapshot and add Version 0 if needed
  const { data: bs } = await supabase
    .from('building_schemas')
    .select('id, initial_schema_snapshot')
    .eq('id', buildingSchemaId)
    .single()

  const parsedInitial = safeParse(schemaSchema, bs?.initial_schema_snapshot)
  const hasInitialSchema =
    parsedInitial.success && !isEmptySchema(parsedInitial.output)

  if (!hasInitialSchema) {
    return versions ?? []
  }

  const versionZero: Version = {
    id: 'initial',
    building_schema_id: buildingSchemaId,
    number: 0,
    patch: null,
    reverse_patch: null,
  }

  return [...(versions ?? []), versionZero]
}
