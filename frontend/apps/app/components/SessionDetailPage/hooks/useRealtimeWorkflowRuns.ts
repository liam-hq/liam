'use client'

import { workflowRunsSchema } from '@liam-hq/db'
import { useCallback, useEffect, useState } from 'react'
import * as v from 'valibot'
import { createClient } from '@/libs/db/client'
import type { WorkflowRunStatus } from '../types'

export function useRealtimeWorkflowRuns(
  designSessionId: string,
  initialStatus: WorkflowRunStatus | null,
) {
  const [error, setError] = useState<Error | null>(null)

  const handleError = useCallback((err: unknown) => {
    setError(
      err instanceof Error
        ? err
        : new Error('Realtime workflow runs update processing failed'),
    )
  }, [])

  const [status, setStatus] = useState<WorkflowRunStatus | null>(initialStatus)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`workflow_runs:${designSessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workflow_runs',
          filter: `design_session_id=eq.${designSessionId}`,
        },
        (payload) => {
          try {
            const parsed = v.safeParse(workflowRunsSchema, payload.new)
            if (!parsed.success) {
              throw new Error('Invalid timeline item format')
            }

            const updatedWorkflowRun = parsed.output
            if (updatedWorkflowRun.design_session_id === designSessionId) {
              setStatus(updatedWorkflowRun.status)
            }
          } catch (error) {
            handleError(error)
          }
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          handleError(new Error('Workflow runs realtime subscription failed'))
        }
      })

    return () => {
      channel.unsubscribe()
    }
  }, [designSessionId, handleError])

  return {
    status,
    error,
  }
}
