import { useCallback, useEffect } from 'react'

export const useAutoResizeTextarea = (
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
) => {
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [textareaRef])

  useEffect(() => {
    adjustHeight()
  }, [adjustHeight])

  const handleChange = useCallback(
    (onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void) =>
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e)
        // Trigger height adjustment after state update
        requestAnimationFrame(adjustHeight)
      },
    [adjustHeight],
  )

  return { handleChange, adjustHeight }
}
