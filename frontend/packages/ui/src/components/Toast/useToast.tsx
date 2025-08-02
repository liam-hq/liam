import { useContext } from 'react'
import { ToastContext } from './Toast'

export const useToast = () => useContext(ToastContext).headerToast

export const useCommandPaletteToast = () =>
  useContext(ToastContext).commandPaletteToast
