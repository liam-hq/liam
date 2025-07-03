import { createContext } from 'react'

type CommandPaletteContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  toggleOpen: () => void
}

export const CommandPaletteContext =
  createContext<CommandPaletteContextValue | null>(null)
