import type { KeyboardEvent } from 'react'

type NormalKeyHandlerOptions = {
  isImeComposing: boolean
  hasContent: boolean
  onSubmit: () => void
}

export const handleNormalKey = (
  e: KeyboardEvent<HTMLTextAreaElement>,
  { isImeComposing, hasContent, onSubmit }: NormalKeyHandlerOptions,
): void => {
  if (e.nativeEvent.isComposing || isImeComposing) return

  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()

    if (hasContent) {
      onSubmit()
    }
  }
}
