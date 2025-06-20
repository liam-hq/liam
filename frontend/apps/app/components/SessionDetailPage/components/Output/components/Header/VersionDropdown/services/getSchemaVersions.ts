import { createClient } from '@/libs/db/client'
import type { Version } from '../../../../../../types'

export async function getSchemaVersions(
  designSessionId: string,
): Promise<Version[]> {
  const supabase = createClient()

  const { data: buildingSchema, error: buildingSchemaError } = await supabase
    .from('building_schemas')
    .select('id')
    .eq('design_session_id', designSessionId)
    .single()

  if (buildingSchemaError || !buildingSchema) {
    return []
  }

  const { data: schemaVersions, error: schemaVersionsError } = await supabase
    .from('building_schema_versions')
    .select('id, number')
    .eq('building_schema_id', buildingSchema.id)
    .order('number', { ascending: false })

  if (schemaVersionsError || !schemaVersions) {
    return []
  }

  return schemaVersions
}
