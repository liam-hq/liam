'use server'

import { createClient } from '@/libs/db/server'
import type { Version } from '../types'

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

  return data ?? []
}
