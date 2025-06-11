'use client'

import { useEffect, useState } from 'react'

interface UseTriggerAuthReturn {
  accessToken: string | undefined
  baseURL: string
  isReady: boolean
  error: string | undefined
}

interface TriggerAuthResponse {
  accessToken: string
  baseURL: string
}

/**
 * Type guard to check if the response has the expected structure
 */
const isTriggerAuthResponse = (data: unknown): data is TriggerAuthResponse => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'accessToken' in data &&
    'baseURL' in data &&
    typeof (data as Record<string, unknown>).accessToken === 'string' &&
    typeof (data as Record<string, unknown>).baseURL === 'string'
  )
}

/**
 * Custom hook to fetch Trigger.dev access token
 */
export const useTriggerAuth = (): UseTriggerAuthReturn => {
  const [accessToken, setAccessToken] = useState<string | undefined>()
  const [baseURL, setBaseURL] = useState<string>('https://api.trigger.dev')
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    const fetchAccessToken = async () => {
      try {
        const response = await fetch('/api/trigger/auth')
        if (response.ok) {
          const data: unknown = await response.json()
          if (isTriggerAuthResponse(data)) {
            setAccessToken(data.accessToken)
            setBaseURL(data.baseURL)
          } else {
            setError('Invalid response format from auth endpoint')
          }
        } else {
          setError('Failed to fetch access token')
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error')
      } finally {
        setIsReady(true)
      }
    }

    fetchAccessToken()
  }, [])

  return {
    accessToken,
    baseURL,
    isReady,
    error,
  }
}
