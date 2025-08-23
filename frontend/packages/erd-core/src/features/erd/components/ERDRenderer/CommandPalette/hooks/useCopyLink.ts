import type { ToastPosition } from '@liam-hq/ui'
import { useCopy } from '@liam-hq/ui/hooks'
import { useCallback } from 'react'

export const useCopyLink = (position?: ToastPosition) => {
  const { copy } = useCopy({
    toast: {
      success: 'Link copied!',
      error: 'URL copy failed',
      position,
    },
  })

  const copyLink = useCallback(() => {
    const url = window.location.href
    copy(url)
  }, [copy])

  return { copyLink }
}
