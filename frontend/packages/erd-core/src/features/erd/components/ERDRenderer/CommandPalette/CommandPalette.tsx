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
import { useCommandPaletteOrThrow } from './CommandPaletteProvider'
import { useSubscribeCommands } from './hooks'

export const CommandPalette: FC = () => {
  useSubscribeCommands()

  const { open, setOpen, toggleOpen } = useCommandPaletteOrThrow()

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
  }, [toggleOpen])

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
