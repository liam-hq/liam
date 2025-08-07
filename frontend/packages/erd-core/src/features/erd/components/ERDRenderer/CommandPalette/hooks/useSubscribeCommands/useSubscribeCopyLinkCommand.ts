import { useCopy } from '@liam-hq/ui/hooks'
import { useEffect } from 'react'

export const useSubscribeCopyLinkCommand = () => {
  const { copy } = useCopy({
    toast: {
      position: 'command-palette',
      success: 'Link copied',
      error: 'URL copy failed',
    },
  })

  // Copy page link when ⌘C is pressed
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key === 'c' && (event.metaKey || event.ctrlKey)) {
        // Copy the selected text instead if there is any
        const selection = window.getSelection()
        if (selection?.toString()) return

        event.preventDefault()
        const url = window.location.href
        copy(url)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [copy])
}
