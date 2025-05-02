import { createClient } from '@/libs/db/server'

type Params = {
  projectId: string
  organizationId: string
}

export const getSchemaFilePath = async ({
  projectId,
  organizationId,
}: Params) => {
  const supabase = await createClient()

  return await supabase
    .from('schema_file_paths')
    .select('path, format')
    .eq('project_id', projectId)
    .eq('organization_id', organizationId)
    .single()
}
