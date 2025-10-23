'use server'

import { schemaSchema } from '@liam-hq/schema'
import { safeParse } from 'valibot'
import { createClient } from '../../../libs/db/server'
import type { Version, VersionZero } from '../types'

function isEmptySchema(schema: unknown): boolean {
  const parsed = safeParse(schemaSchema, schema)
  if (!parsed.success) return true

  const { tables, enums, extensions } = parsed.output
  return (
    Object.keys(tables).length === 0 &&
    Object.keys(enums).length === 0 &&
    Object.keys(extensions).length === 0
  )
}

export async function getVersions(
  buildingSchemaId: string,
): Promise<Version[]> {
  const supabase = await createClient()
  const { data } = await supabase
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

  const versions: Version[] = data ?? []

  const { data: buildingSchema } = await supabase
    .from('building_schemas')
    .select('id, initial_schema_snapshot')
    .eq('id', buildingSchemaId)
    .single()

  if (
    buildingSchema?.initial_schema_snapshot &&
    !isEmptySchema(buildingSchema.initial_schema_snapshot)
  ) {
    const versionZero: VersionZero = {
      id: 'initial',
      building_schema_id: buildingSchemaId,
      number: 0,
      patch: null,
      reverse_patch: null,
    }
    versions.push(versionZero)
  }

  return versions
}
