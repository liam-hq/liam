import type { QueryData } from '@liam-hq/db'
import { createClient } from '@/libs/db/server'

export async function getOrganizationsByUserId(userId: string) {
  const supabase = await createClient()

  return await supabase
    .from('organization_members')
    .select('organizations:organization_id(id, name)')
    .eq('user_id', userId)
}

export type OrganizationsByUserId = QueryData<
  ReturnType<typeof getOrganizationsByUserId>
>
