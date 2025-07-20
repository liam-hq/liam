import { createContext } from 'react'

export type CommandPaletteInnerContextValue = {
  goToERD: (tableName: string) => void
}

export const CommandPaletteInnerContext =
  createContext<CommandPaletteInnerContextValue | null>(null)
