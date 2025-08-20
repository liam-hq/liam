import { useCopy } from '@liam-hq/ui/hooks'
import { useQueryState } from 'nuqs'
import { useCallback } from 'react'

export const useCopyLink = () => {
  const [toastPosition] = useQueryState('toast', { defaultValue: '' })

  const { copy } = useCopy({
    toast: {
      success: 'Link copied!',
      error: 'URL copy failed',
      position: toastPosition === 'header' ? 'header' : 'command-palette',
    },
  })

  const copyLink = useCallback(() => {
    const url = window.location.href
    copy(url)
  }, [copy])

  return { copyLink }
}
