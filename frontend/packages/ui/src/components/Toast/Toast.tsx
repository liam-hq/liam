'use client'

import * as RadixToast from '@radix-ui/react-toast'
import clsx from 'clsx'
import {
  createContext,
  type FC,
  type PropsWithChildren,
  useCallback,
  useState,
} from 'react'
import styles from './Toast.module.css'
import type { ToastFn, ToastItem, ToastOptions } from './types'

type Props = ToastOptions & {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export const Toast: FC<Props> = ({
  title,
  description,
  isOpen,
  onOpenChange,
  status,
}) => {
  return (
    <RadixToast.Root
      className={clsx(
        styles.wrapper,
        status === 'success' && styles.success,
        status === 'error' && styles.error,
        status === 'warning' && styles.warning,
        status === 'info' && styles.info,
      )}
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <RadixToast.Title className={styles.title}>{title}</RadixToast.Title>
      {description && (
        <RadixToast.Description className={styles.description}>
          {description}
        </RadixToast.Description>
      )}
    </RadixToast.Root>
  )
}

export const ToastContext = createContext<ToastFn>(() => '')

export const ToastProvider = ({ children }: PropsWithChildren) => {
  const [toastItem, setToastItem] = useState<ToastItem | null>(null)
  const closeToastItem = useCallback(() => {
    setToastItem((prev) => (prev === null ? null : { ...prev, isOpen: false }))
  }, [])
  const createToastItem = useCallback((options: ToastOptions) => {
    closeToastItem()
    window.setTimeout(() => setToastItem({ ...options, isOpen: true }), 100)
  }, [])

  return (
    <RadixToast.Provider>
      <ToastContext.Provider value={createToastItem}>
        {children}
        {toastItem && <Toast {...toastItem} onOpenChange={closeToastItem} />}
        <RadixToast.Viewport className={styles.viewport} />
      </ToastContext.Provider>
    </RadixToast.Provider>
  )
}
