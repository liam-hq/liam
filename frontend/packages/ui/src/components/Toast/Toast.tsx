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

export const ToastContext = createContext<{
  headerToast: ToastFn
  commandPaletteToast: ToastFn
}>({
  headerToast: () => '',
  commandPaletteToast: () => '',
})

export const ToastProvider = ({ children }: PropsWithChildren) => {
  const [headerToastItems, setHeaderToastItems] = useState<ToastItem[]>([])
  const handleHeaderToastOpenChange = useCallback((id: ToastId) => {
    return () => {
      setHeaderToastItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isOpen: !item.isOpen } : item,
        ),
      )
    }
  }, [])
  const headerToast = useCallback((options: ToastOptions): ToastId => {
    const id = nanoid()
    setHeaderToastItems((prev) => [...prev, { ...options, id, isOpen: true }])
    return id
  }, [])

  const [commandPaletteToastItems, setCommandPaletteToastItems] = useState<
    ToastItem[]
  >([])
  const handleCommandPaletteToastOpenChange = useCallback((id: ToastId) => {
    return () => {
      setCommandPaletteToastItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isOpen: !item.isOpen } : item,
        ),
      )
    }
  }, [])
  const commandPaletteToast = useCallback((options: ToastOptions): ToastId => {
    const id = nanoid()
    setCommandPaletteToastItems((prev) => [
      ...prev,
      { ...options, id, isOpen: true },
    ])
    return id
  }, [])

  return (
    <ToastContext.Provider value={{ headerToast, commandPaletteToast }}>
      {children}
      <ToastHeaderViewport>
        {headerToastItems.map((value) => (
          <Toast
            key={value.id}
            {...value}
            onOpenChange={handleHeaderToastOpenChange(value.id)}
          />
        ))}
      </ToastHeaderViewport>
      <ToastCommandPaletteViewport>
        {commandPaletteToastItems.map((value) => (
          <Toast
            key={value.id}
            {...value}
            onOpenChange={handleCommandPaletteToastOpenChange(value.id)}
          />
        ))}
      </ToastCommandPaletteViewport>
    </ToastContext.Provider>
  )
}
