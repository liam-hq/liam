import { type ChangeEvent, type RefObject, useCallback, useEffect } from 'react'

export const useAutoResizeTextarea = (
  textareaRef: RefObject<HTMLTextAreaElement | null>,
  value: string,
) => {
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [textareaRef])

  useEffect(() => {
    adjustHeight()
  }, [value, adjustHeight])

  const handleChange = useCallback(
    (handler: (e: ChangeEvent<HTMLTextAreaElement>) => void) => {
      return (e: ChangeEvent<HTMLTextAreaElement>) => {
        adjustHeight()
        handler(e)
      }
    },
    [adjustHeight],
  )

  return { handleChange }
}
