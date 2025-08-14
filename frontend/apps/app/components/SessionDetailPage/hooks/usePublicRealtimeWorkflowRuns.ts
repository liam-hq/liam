'use client'

import type { WorkflowRunStatus } from '../types'

export function usePublicRealtimeWorkflowRuns(
  _designSessionId: string,
  initialStatus: WorkflowRunStatus | null,
) {
  // Public view does not support realtime updates
  // Return initial status without any updates
  return {
    status: initialStatus,
  }
}
