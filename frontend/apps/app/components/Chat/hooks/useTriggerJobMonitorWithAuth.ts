'use client'

import { useRealtimeRun } from '@trigger.dev/react-hooks'
import { useEffect, useState } from 'react'
import type { TriggerJobResult } from './types'
import { useTriggerAuth } from './useTriggerAuth'

interface UseTriggerJobMonitorWithAuthProps {
  triggerJobId: string | undefined
  onJobComplete: (result: TriggerJobResult) => void
  onJobError: (error: string) => void
}

interface UseTriggerJobMonitorWithAuthReturn {
  isMonitoring: boolean
  jobStatus: string | undefined
  error: string | undefined
  authReady: boolean
  hasValidAuth: boolean
}

/**
 * Custom hook that combines Trigger.dev authentication and job monitoring
 * Falls back gracefully when authentication is not available
 */
export const useTriggerJobMonitorWithAuth = ({
  triggerJobId,
  onJobComplete,
  onJobError,
}: UseTriggerJobMonitorWithAuthProps): UseTriggerJobMonitorWithAuthReturn => {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [jobStatus, setJobStatus] = useState<string | undefined>()
  const [error, setError] = useState<string | undefined>()
  const [currentJobId, setCurrentJobId] = useState<string | undefined>()

  // Get Trigger.dev authentication
  const {
    accessToken,
    baseURL,
    isReady: authReady,
    error: authError,
  } = useTriggerAuth()

  const hasValidAuth = authReady && !!accessToken && !authError

  // Use Trigger.dev React Hook with valid access token
  const { run, error: triggerError } = useRealtimeRun(triggerJobId || '', {
    accessToken: accessToken || 'dummy-token',
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
      setIsMonitoring(hasValidAuth)
      setJobStatus(hasValidAuth ? 'monitoring' : undefined)
      setError(undefined)
    }
  }, [triggerJobId, currentJobId, hasValidAuth])

  useEffect(() => {
    if (triggerError && hasValidAuth) {
      setError(triggerError.message || 'Unknown error')
      setIsMonitoring(false)
      onJobError(triggerError.message || 'Job monitoring failed')
    }
  }, [triggerError, onJobError, hasValidAuth])

  useEffect(() => {
    if (!run || !hasValidAuth) return

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
  }, [run, onJobComplete, onJobError, currentJobId, hasValidAuth])

  return {
    isMonitoring: hasValidAuth ? isMonitoring : false,
    jobStatus: hasValidAuth ? jobStatus : undefined,
    error: hasValidAuth ? error : undefined,
    authReady,
    hasValidAuth,
  }
}
