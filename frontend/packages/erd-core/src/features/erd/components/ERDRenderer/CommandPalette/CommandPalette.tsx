'use client'

import { Button, Search, Table2 } from '@liam-hq/ui'
import {
  DialogClose,
  DialogDescription,
  DialogTitle,
} from '@radix-ui/react-dialog'
import { Command } from 'cmdk'
import { type FC, useCallback, useEffect, useState } from 'react'
import { useTableSelection } from '@/features/erd/hooks'
import { useSchema } from '@/stores'
import { TableNode } from '../../ERDContent/components'
import styles from './CommandPalette.module.css'
import { useCommandPalette } from './CommandPaletteProvider'

const getTableLinkHref = (activeTableName: string) => {
  if (typeof window === 'undefined') return
  const searchParams = new URLSearchParams(window.location.search)
  searchParams.set('active', activeTableName)
  return `?${searchParams.toString()}`
}

export const CommandPalette: FC = () => {
  const { open, setOpen, toggleOpen } = useCommandPalette()

  const schema = useSchema()
  const [tableName, setTableName] = useState<string | null>(null)
  const table = schema.current.tables[tableName ?? '']
  const { selectTable } = useTableSelection()

  const goToERD = useCallback(
    (tableName: string) => {
      selectTable({ tableId: tableName, displayArea: 'main' })
      setOpen(false)
    },
    [selectTable],
  )

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

  // Select option by pressing [Enter] key (with/without ⌘ key)
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (!open || !tableName) return

      if (event.key === 'Enter') {
        if (event.metaKey || event.ctrlKey) {
          window.open(getTableLinkHref(tableName))
        } else {
          goToERD(tableName)
        }
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, tableName])

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      contentClassName={styles.content}
      value={tableName ?? ''}
      onValueChange={(v) => setTableName(v)}
    >
      <DialogTitle hidden>Command Palette</DialogTitle>
      <DialogDescription hidden>
        A search-based interface that allows quick access to various commands
        and features within the application.
      </DialogDescription>
      <div className={styles.searchContainer}>
        <div className={styles.searchFormWithIcon}>
          <Search className={styles.searchIcon} />
          <Command.Input
            placeholder="Search"
            onBlur={(event) => event.target.focus()}
          />
        </div>
        <DialogClose asChild>
          <Button
            size="xs"
            variant="outline-secondary"
            className={styles.escButton}
          >
            ESC
          </Button>
        </DialogClose>
      </div>
      <div className={styles.main}>
        <Command.List>
          <Command.Empty>No results found.</Command.Empty>
          <Command.Group heading="Tables">
            {Object.values(schema.current.tables).map((table) => (
              <Command.Item key={table.name} value={table.name} asChild>
                <a
                  href={getTableLinkHref(table.name)}
                  onClick={(event) => {
                    // Do not call preventDefault to allow the default link behavior when ⌘ key is pressed
                    if (event.ctrlKey || event.metaKey) {
                      return
                    }

                    event.preventDefault()
                    goToERD(table.name)
                  }}
                >
                  <Table2 className={styles.itemIcon} />
                  <span className={styles.itemText}>{table.name}</span>
                </a>
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
        <div
          className={styles.previewContainer}
          data-testid="CommandPalettePreview"
        >
          <div className={styles.previewBackground}>
            {table && (
              <TableNode
                id=""
                type="table"
                data={{
                  table: table,
                  isActiveHighlighted: false,
                  isHighlighted: false,
                  isTooltipVisible: false,
                  sourceColumnName: undefined,
                  targetColumnCardinalities: undefined,
                  showMode: 'ALL_FIELDS',
                }}
                dragging={false}
                isConnectable={false}
                positionAbsoluteX={0}
                positionAbsoluteY={0}
                zIndex={0}
              />
            )}
          </div>
        </div>
      </div>
    </Command.Dialog>
  )
}
