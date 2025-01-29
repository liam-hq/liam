import * as RadixToast from '@radix-ui/react-toast'
import clsx from 'clsx'
import { nanoid } from 'nanoid'
import {
  type FC,
  type PropsWithChildren,
  createContext,
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
      className={clsx(styles.wrapper, {
        [styles.success]: status === 'success',
        [styles.error]: status === 'error',
        [styles.warning]: status === 'warning',
        [styles.info]: status === 'info',
      })}
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
    <RadixToast.Provider>
      <ToastContext.Provider value={toast}>
        {children}
        {toastItems.map((value) => (
          <Toast
            key={value.id}
            {...value}
            onOpenChange={handleOpenChange(value.id)}
          />
        ))}
        <RadixToast.Viewport className={styles.viewport} />
      </ToastContext.Provider>
    </RadixToast.Provider>
  )
}
