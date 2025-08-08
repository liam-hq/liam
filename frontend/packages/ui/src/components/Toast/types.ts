type ToastStatus = 'success' | 'error' | 'warning' | 'info'

export type ToastOptions = {
  title: string
  description?: string
  status: ToastStatus
}

export type ToastItem = ToastOptions & { isOpen: boolean }

export type ToastFn = (options: ToastOptions) => void
