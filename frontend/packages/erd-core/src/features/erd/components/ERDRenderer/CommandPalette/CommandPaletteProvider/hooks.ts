import { useContext } from 'react'
import { CommandPaletteContext } from './context'

export const useCommandPalette = () => {
  const commandPaletteValue = useContext(CommandPaletteContext)
  if (!commandPaletteValue)
    throw new Error(
      'useCommandPalette must be used within CommandPaletteProvider',
    )

  return commandPaletteValue
}
