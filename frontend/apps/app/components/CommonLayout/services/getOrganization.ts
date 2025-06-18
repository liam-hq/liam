import type { QueryData } from '@liam-hq/db'
import { createClient } from '@/libs/db/server'

async function query(organizationId: string) {
  const supabase = await createClient()

  return await supabase
    .from('organizations')
    .select('id, name')
    .eq('id', organizationId)
    .single()
}

export async function getOrganization(organizationId: string | null) {
  if (!organizationId) {
    return { data: null, error: null }
  }

  return query(organizationId)
}

export type Organization = QueryData<ReturnType<typeof query>>
