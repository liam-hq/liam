import { useCallback, useEffect, useState } from 'react'

export const usePublicShare = (designSessionId: string) => {
  const [isPublic, setIsPublic] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkPublicShareStatus = async () => {
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
      } finally {
        setIsLoading(false)
      }
    }

    checkPublicShareStatus()
  }, [designSessionId])

  const togglePublicShare = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/design-sessions/${designSessionId}/public-share`,
        {
          method: isPublic ? 'DELETE' : 'POST',
        },
      )

      if (response.ok) {
        setIsPublic(!isPublic)
      } else {
        console.error('Failed to update public share status')
      }
    } catch (error) {
      console.error('Failed to toggle public share:', error)
    } finally {
      setIsLoading(false)
    }
  }, [designSessionId, isPublic])

  return {
    isPublic,
    isLoading,
    togglePublicShare,
  }
}
