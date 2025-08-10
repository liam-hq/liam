import { useEffect } from 'react'
import { useCopyLink } from '../useCopyLink'

export const useSubscribeCopyLinkCommand = () => {
  const { copyLink } = useCopyLink()

  // Copy page link when ⌘C is pressed
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key === 'c' && (event.metaKey || event.ctrlKey)) {
        // Copy the selected text instead if there is any
        const selection = document.getSelection()
        if (selection?.toString()) return

        event.preventDefault()
        copyLink()
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [copyLink])
}
