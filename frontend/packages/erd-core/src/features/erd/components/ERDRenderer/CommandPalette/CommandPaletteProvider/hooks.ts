import { err, ok, type Result } from 'neverthrow'
import { useContext } from 'react'
import {
  CommandPaletteContext,
  type CommandPaletteContextValue,
} from './context'

export const useCommandPalette = (): Result<
  CommandPaletteContextValue,
  Error
> => {
  const commandPaletteValue = useContext(CommandPaletteContext)
  if (!commandPaletteValue)
    return err(
      new Error('useCommandPalette must be used within CommandPaletteProvider'),
    )

  return ok(commandPaletteValue)
}

export const useCommandPaletteOrThrow = (): CommandPaletteContextValue => {
  const result = useCommandPalette()
  if (result.isErr()) {
    throw result.error
  }
  return result.value
}
