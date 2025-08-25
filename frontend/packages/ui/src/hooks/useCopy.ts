import { fromPromise } from 'neverthrow'
import { useCallback, useState } from 'react'
import type { ToastPosition } from '../components/Toast/types'
import { useToast } from '../components/Toast/useToast'

type UseCopyOptions = {
  toast?: {
    success: string
    error: string
    position?: ToastPosition
  }
  resetDelay?: number
}

type UseCopyReturn = {
  isCopied: boolean
  copy: (text: string) => Promise<void>
}

export const useCopy = (options: UseCopyOptions = {}): UseCopyReturn => {
  const { toast: toastMessages, resetDelay = 2000 } = options
  const [isCopied, setIsCopied] = useState(false)
  const toast = useToast(toastMessages?.position)

  const copy = useCallback(
    async (text: string) => {
      // Feature detection for clipboard API
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        console.error('Clipboard API not available')
        if (toastMessages) {
          toast({
            title: 'Clipboard unavailable',
            status: 'error',
          })
        }
        return
      }

      const runCopy = fromPromise(
        navigator.clipboard.writeText(text),
        (error) => (error instanceof Error ? error : new Error(String(error))),
      )

      const handleSuccess = () => {
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), resetDelay)

        if (toastMessages) {
          toast({
            title: toastMessages.success,
            status: 'success',
          })
        }
      }

      const handleError = (error: Error) => {
        console.error('Failed to copy text:', error)

        if (toastMessages) {
          toast({
            title: toastMessages.error,
            status: 'error',
          })
        }
      }

      await runCopy.match(handleSuccess, handleError)
    },
    [toast, toastMessages, resetDelay],
  )

  return { isCopied, copy }
}
