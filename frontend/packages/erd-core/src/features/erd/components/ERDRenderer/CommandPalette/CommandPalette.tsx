'use client'

import { Search, Table2 } from '@liam-hq/ui'
import { DialogDescription, DialogTitle } from '@radix-ui/react-dialog'
import { Command } from 'cmdk'
import { type FC, useCallback, useEffect, useId, useState } from 'react'
import { useTableSelection } from '@/features/erd/hooks'
import { useSchema } from '@/stores'
import { TableNode } from '../../ERDContent/components'
import styles from './CommandPalette.module.css'

export const CommandPalette: FC = () => {
  const [open, setOpen] = useState(false)
  const tableNodeId = useId()

  const schema = useSchema()
  const [tableName, setTableName] = useState<string | null>(null)
  const table = schema.current.tables[tableName ?? '']
  const { selectTable } = useTableSelection()

  const [focusedTableName, setFocusedTableName] = useState<string | null>(null)

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
      value={tableName ?? ''}
      onValueChange={(v) => {
        if (focusedTableName) return
        setTableName(v)
      }}
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
          <Command.Empty>No results found.</Command.Empty>
          <Command.Group heading="Suggestions">
            {Object.values(schema.current.tables).map((table) => (
              <Command.Item
                key={table.name}
                value={table.name}
                onSelect={() => goToERD(table.name)}
                data-focused={focusedTableName === table.name}
              >
                <button
                  type="button"
                  className={styles.itemInner}
                  onClick={(event) => {
                    event.stopPropagation()
                    setTableName(table.name)
                    setFocusedTableName((prev) =>
                      prev === table.name ? null : table.name,
                    )
                  }}
                  onDoubleClick={() => goToERD(table.name)}
                >
                  <Table2 className={styles.itemIcon} />
                  {table.name}
                </button>
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
                id={tableNodeId}
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
