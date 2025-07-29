import { createContext } from 'react'

export type CommandPaletteInnerContextValue = {
  goToERD: (tableName: string) => void
  copyLink: () => void
  zoomToFit: () => void
  tidyUp: () => void
  showAllField: () => void
  showTableName: () => void
  showKeyOnly: () => void
}

export const CommandPaletteInnerContext =
  createContext<CommandPaletteInnerContextValue | null>(null)
