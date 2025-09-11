import { fromPromise } from 'neverthrow'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import {
  disablePublicShare,
  enablePublicShare,
} from '../features/public-share/actions'

type UsePublicShareServerActionProps = {
  designSessionId: string
  initialIsPublic: boolean
}

export const usePublicShareServerAction = ({
  designSessionId,
  initialIsPublic = false,
}: UsePublicShareServerActionProps) => {
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(false)
  const isPublicRef = useRef(initialIsPublic)

  // Reset state when designSessionId or initialIsPublic changes
  useEffect(() => {
    setIsPublic(initialIsPublic)
    isPublicRef.current = initialIsPublic
  }, [initialIsPublic])

  // Keep ref in sync with state after commit
  useEffect(() => {
    isPublicRef.current = isPublic
  }, [isPublic])

  const togglePublicShare = useCallback(async () => {
    const currentIsPublic = isPublicRef.current

    setIsLoading(true)

    const result = await fromPromise(
      currentIsPublic
        ? disablePublicShare(designSessionId)
        : enablePublicShare(designSessionId),
      (error) => ({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update sharing settings',
      }),
    )

    setIsLoading(false)

    return result.match(
      (data) => {
        if (data.success) {
          startTransition(() => {
            setIsPublic(data.isPublic ?? !currentIsPublic)
          })
        }
        return data
      },
      (errorData) => errorData,
    )
  }, [designSessionId])
  return {
    isPublic,
    loading: isLoading || isPending,
    togglePublicShare,
  }
}
