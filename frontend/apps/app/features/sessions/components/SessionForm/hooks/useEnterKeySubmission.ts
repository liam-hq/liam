import type { KeyboardEvent, RefObject } from 'react'

export const useEnterKeySubmission = (
  hasContent: boolean,
  isPending: boolean,
  formRef: RefObject<HTMLFormElement | null>,
) => {
  return (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
      e.preventDefault()
      if (formRef.current && hasContent && !isPending) {
        formRef.current.requestSubmit()
      }
    }
  }
}
