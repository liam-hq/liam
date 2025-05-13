import { createClient } from '@/libs/db/server'

export const getDocFilePaths = async (projectId: string) => {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('doc_file_paths')
      .select('*')
      .eq('project_id', projectId)

    return data || []
  } catch (error) {
    console.error('Error fetching doc file paths:', error)
    return []
  }
}
