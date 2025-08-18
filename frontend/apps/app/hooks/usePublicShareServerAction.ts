import { useCallback, useState, useTransition } from 'react'
import {
  disablePublicShare,
  enablePublicShare,
} from '@/features/public-share/actions'

type UsePublicShareServerActionProps = {
  designSessionId: string
  initialIsPublic?: boolean
}

export const usePublicShareServerAction = ({
  designSessionId,
  initialIsPublic = false,
}: UsePublicShareServerActionProps) => {
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [isPending, startTransition] = useTransition()

  const togglePublicShare = useCallback(async () => {
    return new Promise<{
      success: boolean
      error?: string
      isPublic?: boolean
    }>((resolve) => {
      startTransition(async () => {
        try {
          const result = isPublic
            ? await disablePublicShare(designSessionId)
            : await enablePublicShare(designSessionId)

          if (result.success) {
            setIsPublic(result.isPublic ?? !isPublic)
          }
          resolve(result)
        } catch (error) {
          resolve({
            success: false,
            error: 'Failed to update sharing settings',
          })
        }
      })
    })
  }, [designSessionId, isPublic])

  return {
    isPublic,
    loading: isPending,
    togglePublicShare,
  }
}
