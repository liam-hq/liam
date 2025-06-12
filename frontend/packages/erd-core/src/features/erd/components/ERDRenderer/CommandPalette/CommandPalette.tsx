'use client'

import { useSchema } from '@/stores'
import { Search, Table2 } from '@liam-hq/ui'
import { DialogDescription, DialogTitle } from '@radix-ui/react-dialog'
import { Command } from 'cmdk'
import { type FC, useEffect, useState } from 'react'
import styles from './CommandPalette.module.css'

export const CommandPalette: FC = () => {
  const [open, setOpen] = useState(false)
  const schema = useSchema()

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      contentClassName={styles.content}
    >
      <DialogTitle hidden>Command Palette</DialogTitle>
      <DialogDescription hidden>
        A search-based interface that allows quick access to various commands
        and features within the application.
      </DialogDescription>
      <div className={styles.searchContainer}>
        <div className={styles.searchFormWithIcon}>
          <Search className={styles.searchIcon} />
          <Command.Input placeholder="Search" />
        </div>
        <span className={styles.escapeSign}>ESC</span>
      </div>
      <div className={styles.main}>
        <Command.List>
          <Command.Group heading="Suggestions">
            {Object.values(schema.current.tables).map((table) => (
              <Command.Item key={table.name} value={table.name}>
                <Table2 className={styles.itemIcon} />
                {table.name}
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  )
}
