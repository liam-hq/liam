'use client'

import { useRealtimeRun } from '@trigger.dev/react-hooks'
import { useEffect, useState } from 'react'
import type { TriggerJobResult } from './types'

interface UseTriggerJobMonitorProps {
  triggerJobId: string | undefined
  accessToken: string
  baseURL: string
  onJobComplete: (result: TriggerJobResult) => void
  onJobError: (error: string) => void
}

interface UseTriggerJobMonitorReturn {
  isMonitoring: boolean
  jobStatus: string | undefined
  error: string | undefined
}

/**
 * Custom hook to monitor Trigger.dev job status using React Hooks
 * This hook assumes a valid accessToken is provided
 */
export const useTriggerJobMonitor = ({
  triggerJobId,
  accessToken,
  baseURL,
  onJobComplete,
  onJobError,
}: UseTriggerJobMonitorProps): UseTriggerJobMonitorReturn => {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [jobStatus, setJobStatus] = useState<string | undefined>()
  const [error, setError] = useState<string | undefined>()
  const [currentJobId, setCurrentJobId] = useState<string | undefined>()

  // Use Trigger.dev React Hook with valid access token
  const { run, error: triggerError } = useRealtimeRun(triggerJobId || '', {
    accessToken,
    baseURL,
  })

  useEffect(() => {
    if (!triggerJobId) {
      setIsMonitoring(false)
      setJobStatus(undefined)
      setError(undefined)
      setCurrentJobId(undefined)
      return
    }

    // Only reset states if this is a new job
    if (triggerJobId !== currentJobId) {
      setCurrentJobId(triggerJobId)
      setIsMonitoring(true)
      setJobStatus('monitoring')
      setError(undefined)
    }
  }, [triggerJobId, currentJobId])

  useEffect(() => {
    if (triggerError) {
      setError(triggerError.message || 'Unknown error')
      setIsMonitoring(false)
      onJobError(triggerError.message || 'Job monitoring failed')
    }
  }, [triggerError, onJobError])

  useEffect(() => {
    if (!run) return

    // Only process run updates for the current job
    if (run.id !== currentJobId) {
      return
    }

    setJobStatus(run.status)

    if (run.status === 'COMPLETED') {
      setIsMonitoring(false)

      // Extract the result from the job output
      const result = run.output as TriggerJobResult
      onJobComplete(result)
    } else if (run.status === 'FAILED' || run.status === 'CRASHED') {
      setIsMonitoring(false)
      setError(run.error?.message || 'Job execution failed')
      onJobError(run.error?.message || 'Job execution failed')
    }
  }, [run, onJobComplete, onJobError, currentJobId])

  return {
    isMonitoring,
    jobStatus,
    error,
  }
}
