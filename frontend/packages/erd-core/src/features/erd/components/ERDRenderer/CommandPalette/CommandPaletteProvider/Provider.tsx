import { type FC, type PropsWithChildren, useCallback, useState } from 'react'
import { CommandPaletteContext } from './context'

type Props = PropsWithChildren

export const CommandPaletteProvider: FC<Props> = ({ children }) => {
  const [open, setOpen] = useState(false)
  const toggleOpen = useCallback(() => setOpen((prev) => !prev), [])

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen, toggleOpen }}>
      {children}
    </CommandPaletteContext.Provider>
  )
}
