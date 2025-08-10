import { useCopy } from '@liam-hq/ui/hooks'
import { useCallback } from 'react'

export const useCopyLink = () => {
  const { copy } = useCopy()

  const copyLink = useCallback(() => {
    const url = window.location.href
    copy(url)
  }, [copy])

  return { copyLink }
}
