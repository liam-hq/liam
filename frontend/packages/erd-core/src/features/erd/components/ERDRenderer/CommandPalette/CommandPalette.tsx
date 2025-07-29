'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '@radix-ui/react-dialog'
import { type FC, useEffect } from 'react'
import styles from './CommandPalette.module.css'
import { CommandPaletteContent } from './CommandPaletteContent'
import { useCommandPalette } from './CommandPaletteProvider'

export const CommandPalette: FC = () => {
  const commandPaletteResult = useCommandPalette()
  if (commandPaletteResult.isErr()) {
    throw commandPaletteResult.error
  }
  const { open, setOpen, toggleOpen } = commandPaletteResult.value

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        toggleOpen()
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogPortal>
        <DialogOverlay className={styles.overlay} />
        <DialogContent className={styles.content}>
          <DialogTitle hidden>Command Palette</DialogTitle>
          <DialogDescription hidden>
            A search-based interface that allows quick access to various
            commands and features within the application.
          </DialogDescription>
          <CommandPaletteContent />
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
