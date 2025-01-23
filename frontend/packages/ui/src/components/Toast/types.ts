export type ToastId = string

type ToastStatus = 'success' | 'error' | 'warning' | 'info'

export type ToastOptions = {
  title: string
  description?: string
  status: ToastStatus
}

export type ToastItem = ToastOptions & { id: ToastId; isOpen: boolean }

export type ToastFn = (options: ToastOptions) => ToastId
