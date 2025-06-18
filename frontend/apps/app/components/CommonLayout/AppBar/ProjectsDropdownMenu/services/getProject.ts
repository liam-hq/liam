import type { QueryData } from '@liam-hq/db'
import { createClient } from '@/libs/db/server'

export async function getProject(projectId: string) {
  const supabase = await createClient()

  return await supabase
    .from('projects')
    .select('id, name')
    .eq('id', projectId)
    .single()
}

export type Project = QueryData<ReturnType<typeof getProject>>
