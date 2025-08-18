'use client'

import type { WorkflowRunStatus } from '../types'

export function usePublicRealtimeWorkflowRuns(
  _designSessionId: string,
  initialStatus: WorkflowRunStatus | null,
) {
  // TODO: Consider enabling realtime updates for public view
  // Currently returns static data from initial load
  return {
    status: initialStatus,
  }
}
