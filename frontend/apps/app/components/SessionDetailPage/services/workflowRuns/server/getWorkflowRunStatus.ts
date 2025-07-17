'use server'

import { createClient } from '@/libs/db/server'
import type { WorkflowRunStatus } from '../../../types'
import { fetchWorkflowRunStatus } from '../fetchWorkflowRunStatus'

export async function getWorkflowRunStatus(
  designSessionId: string,
): Promise<WorkflowRunStatus | null> {
  const supabase = await createClient()

  return await fetchWorkflowRunStatus(supabase, designSessionId)
}
