import { useCallback, useEffect, useState } from 'react'

export const usePublicShareToggle = (designSessionId: string) => {
  const [isPublic, setIsPublic] = useState(false)
  const [loading, setLoading] = useState(false)

  // Get initial state
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(
          `/api/design-sessions/${designSessionId}/public-share`,
        )
        if (response.ok) {
          const data: unknown = await response.json()
          if (
            data &&
            typeof data === 'object' &&
            'isPublic' in data &&
            typeof data.isPublic === 'boolean'
          ) {
            setIsPublic(data.isPublic)
          }
        }
      } catch (error) {
        console.error('Failed to check public share status:', error)
      }
    }

    if (designSessionId) {
      checkStatus()
    }
  }, [designSessionId])

  const togglePublicShare = useCallback(async () => {
    setLoading(true)

    try {
      const method = isPublic ? 'DELETE' : 'POST'
      const response = await fetch(
        `/api/design-sessions/${designSessionId}/public-share`,
        {
          method,
        },
      )

      if (response.ok) {
        setIsPublic(!isPublic)
        return { success: true, isPublic: !isPublic }
      }
      const errorData: unknown = await response.json()
      return {
        success: false,
        error:
          errorData &&
          typeof errorData === 'object' &&
          'error' in errorData &&
          typeof errorData.error === 'string'
            ? errorData.error
            : 'Failed to update sharing settings',
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update sharing settings',
      }
    } finally {
      setLoading(false)
    }
  }, [designSessionId, isPublic])

  return {
    isPublic,
    loading,
    togglePublicShare,
  }
}
