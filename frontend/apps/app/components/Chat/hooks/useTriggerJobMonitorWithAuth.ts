'use client'
import type { TriggerJobResult } from './types'
import { useTriggerAuth } from './useTriggerAuth'
import { useTriggerJobMonitor } from './useTriggerJobMonitor'

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
  // Get Trigger.dev authentication
  const {
    accessToken,
    baseURL,
    isReady: authReady,
    error: authError,
  } = useTriggerAuth()

  const hasValidAuth = authReady && !!accessToken && !authError

  // Always call useTriggerJobMonitor, but with safe defaults when auth is not available
  const { isMonitoring, jobStatus, error } = useTriggerJobMonitor({
    triggerJobId: hasValidAuth ? triggerJobId : undefined,
    accessToken: accessToken || 'dummy-token', // Provide dummy token to satisfy hook requirements
    baseURL,
    onJobComplete: hasValidAuth ? onJobComplete : () => {},
    onJobError: hasValidAuth ? onJobError : () => {},
  })

  return {
    isMonitoring: hasValidAuth ? isMonitoring : false,
    jobStatus: hasValidAuth ? jobStatus : undefined,
    error: hasValidAuth ? error : undefined,
    authReady,
    hasValidAuth,
  }
}
