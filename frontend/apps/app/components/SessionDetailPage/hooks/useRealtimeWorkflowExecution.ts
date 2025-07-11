'use client'

import type { Database } from '@liam-hq/db/supabase/database.types'
import { useCallback, useEffect, useState } from 'react'
import * as v from 'valibot'
import { createClient } from '@/libs/db/client'

type WorkflowExecution = {
  id: string
  design_session_id: string
  organization_id: string
  status: Database['public']['Enums']['execution_status_enum']
  started_at: string | null
  completed_at: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

const workflowExecutionSchema = v.object({
  id: v.string(),
  design_session_id: v.pipe(v.string(), v.uuid()),
  organization_id: v.pipe(v.string(), v.uuid()),
  status: v.picklist(['idle', 'running', 'success', 'failure']),
  started_at: v.nullable(v.string()),
  completed_at: v.nullable(v.string()),
  error_message: v.nullable(v.string()),
  created_at: v.string(),
  updated_at: v.string(),
})

export const useRealtimeWorkflowExecution = (designSessionId: string) => {
  const [workflowExecution, setWorkflowExecution] =
    useState<WorkflowExecution | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const handleError = useCallback((err: unknown) => {
    setError(
      err instanceof Error
        ? err
        : new Error('Realtime workflow execution update processing failed'),
    )
  }, [])

  // 初期データの取得
  useEffect(() => {
    const fetchInitialData = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('workflow_executions')
        .select('*')
        .eq('design_session_id', designSessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        handleError(error)
        return
      }

      if (data) {
        setWorkflowExecution(data)
      }
    }

    fetchInitialData()
  }, [designSessionId, handleError])

  // リアルタイム更新の監視
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`workflow_executions:${designSessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workflow_executions',
          filter: `design_session_id=eq.${designSessionId}`,
        },
        (payload) => {
          try {
            const parsed = v.safeParse(workflowExecutionSchema, payload.new)
            if (!parsed.success) {
              throw new Error('Invalid workflow execution payload')
            }

            setWorkflowExecution(parsed.output)
          } catch (error) {
            handleError(error)
          }
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          handleError(
            new Error('Workflow execution realtime subscription failed'),
          )
        }
      })

    return () => {
      channel.unsubscribe()
    }
  }, [designSessionId, handleError])

  const isGenerating = workflowExecution?.status === 'running'

  return {
    workflowExecution,
    isGenerating,
    error,
  }
}
