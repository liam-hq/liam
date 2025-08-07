import { useContext } from 'react'
import { ToastContext } from './Toast'
import type { ToastPosition } from './types'

export const useToast = (position?: ToastPosition) => {
  const { headerToast, commandPaletteToast } = useContext(ToastContext)
  switch (position) {
    case 'header':
      return headerToast
    case 'command-palette':
      return commandPaletteToast
    default:
      return headerToast
  }
}
