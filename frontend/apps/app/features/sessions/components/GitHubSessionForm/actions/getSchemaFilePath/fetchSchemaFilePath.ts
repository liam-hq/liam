'use server'

import { createClient } from '../../../../../../libs/db/server'

export const fetchSchemaFilePath = async (projectId: string | null) => {
  if (!projectId) {
    return { data: null, error: null }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('schema_file_paths')
    .select('path')
    .eq('project_id', projectId)
    .single()

  if (error) {
    console.error('Error fetching schema file path:', error)
    return { data: null, error: error.message }
  }

  return { data: data?.path || null, error: null }
}
