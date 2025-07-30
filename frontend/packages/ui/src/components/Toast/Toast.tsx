'use client'

import * as RadixToast from '@radix-ui/react-toast'
import clsx from 'clsx'
import { nanoid } from 'nanoid'
import {
  createContext,
  type FC,
  type PropsWithChildren,
  useCallback,
  useState,
} from 'react'
import styles from './Toast.module.css'
import type { ToastFn, ToastId, ToastItem, ToastOptions } from './types'

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

export const ToastHeaderViewport: FC<React.PropsWithChildren> = ({
  children,
}) => {
  return (
    <RadixToast.Provider>
      {children}
      <RadixToast.Viewport className={clsx(styles.viewport, styles.header)} />
    </RadixToast.Provider>
  )
}

export const ToastCommandPaletteViewport: FC<React.PropsWithChildren> = ({
  children,
}) => {
  return (
    <RadixToast.Provider>
      {children}
      <RadixToast.Viewport
        className={clsx(styles.viewport, styles.commandPalette)}
      />
    </RadixToast.Provider>
  )
}

export const ToastContext = createContext<ToastFn>(() => '')

export const ToastProvider = ({ children }: PropsWithChildren) => {
  const [toastItems, setToastItems] = useState<ToastItem[]>([])
  const handleOpenChange = useCallback((id: ToastId) => {
    return () => {
      setToastItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isOpen: !item.isOpen } : item,
        ),
      )
    }
  }, [])
  const toast = useCallback((options: ToastOptions): ToastId => {
    const id = nanoid()
    setToastItems((prev) => [...prev, { ...options, id, isOpen: true }])
    return id
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastHeaderViewport>
        {toastItems.map((value) => (
          <Toast
            key={value.id}
            {...value}
            onOpenChange={handleOpenChange(value.id)}
          />
        ))}
      </ToastHeaderViewport>
      <ToastCommandPaletteViewport>
        {toastItems.map((value) => (
          <Toast
            key={value.id}
            {...value}
            onOpenChange={handleOpenChange(value.id)}
          />
        ))}
      </ToastCommandPaletteViewport>
    </ToastContext.Provider>
  )
}
