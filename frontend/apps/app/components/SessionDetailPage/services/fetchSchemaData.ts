import { createClient } from '@/libs/db/server'

async function query(designSessionId: string) {
  const supabase = await createClient()

  return await supabase
    .from('building_schemas')
    .select('id, schema')
    .eq('design_session_id', designSessionId)
    .single()
}

export async function fetchSchemaData(designSessionId: string | null) {
  if (!designSessionId) {
    return { data: null, error: null }
  }

  return await query(designSessionId)
}
