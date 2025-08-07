import { err, ok, type Result } from 'neverthrow'
import { useContext } from 'react'
import {
  CommandPaletteInnerContext,
  type CommandPaletteInnerContextValue,
} from './context'

export const useCommandPaletteInner = (): Result<
  CommandPaletteInnerContextValue,
  Error
> => {
  const commandPaletteValue = useContext(CommandPaletteInnerContext)
  if (!commandPaletteValue)
    return err(
      new Error(
        'useCommandPaletteInner must be used within CommandPaletteInnerProvider',
      ),
    )

  return ok(commandPaletteValue)
}

export const useCommandPaletteInnerOrThrow =
  (): CommandPaletteInnerContextValue => {
    const result = useCommandPaletteInner()
    if (result.isErr()) {
      throw result.error
    }
    return result.value
  }
