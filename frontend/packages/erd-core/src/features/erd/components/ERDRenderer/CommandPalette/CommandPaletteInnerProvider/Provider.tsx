import { type FC, type PropsWithChildren, useCallback } from 'react'
import { useTableSelection } from '@/features/erd/hooks'
import { useCommandPaletteOrThrow } from '../CommandPaletteProvider'
import { CommandPaletteInnerContext } from './context'

type Props = PropsWithChildren

export const CommandPaletteInnerProvider: FC<Props> = ({ children }) => {
  const { setOpen } = useCommandPaletteOrThrow()
  const { selectTable } = useTableSelection()

  const goToERD = useCallback(
    (tableName: string) => {
      selectTable({ tableId: tableName, displayArea: 'main' })
      setOpen(false)
    },
    [selectTable, setOpen],
  )

  return (
    <CommandPaletteInnerContext.Provider value={{ goToERD }}>
      {children}
    </CommandPaletteInnerContext.Provider>
  )
}
