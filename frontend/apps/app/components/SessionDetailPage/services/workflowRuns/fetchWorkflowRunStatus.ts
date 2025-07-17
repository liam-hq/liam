import type { SupabaseClient } from '@liam-hq/db'
import type { WorkflowRunStatus } from '../../types'

export async function fetchWorkflowRunStatus(
  supabase: SupabaseClient,
  designSessionId: string,
): Promise<WorkflowRunStatus | null> {
  const { data } = await supabase
    .from('workflow_runs')
    .select('status')
    .eq('design_session_id', designSessionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data ? data.status : null
}
