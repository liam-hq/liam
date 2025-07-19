import { createContext } from 'react'

export type CommandPaletteContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  toggleOpen: () => void
}

export const CommandPaletteContext =
  createContext<CommandPaletteContextValue | null>(null)
