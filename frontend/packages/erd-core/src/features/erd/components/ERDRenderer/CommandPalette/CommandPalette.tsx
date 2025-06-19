'use client'

import { Search, Table2 } from '@liam-hq/ui'
import { DialogDescription, DialogTitle } from '@radix-ui/react-dialog'
import { ReactFlowProvider } from '@xyflow/react'
import { Command } from 'cmdk'
import { type FC, useEffect, useId, useState } from 'react'
import { useSchema } from '@/stores'
import { TableNode } from '../../ERDContent/components'
import styles from './CommandPalette.module.css'

export const CommandPalette: FC = () => {
  const [open, setOpen] = useState(false)
  const tableNodeId = useId()

  const schema = useSchema()
  const [tableName, setTableName] = useState<string | null>(null)
  const table = schema.current.tables[tableName ?? '']

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
          <Command.Input placeholder="Search" />
        </div>
        <span className={styles.escapeSign}>ESC</span>
      </div>
      <div className={styles.main}>
        <Command.List>
          <Command.Empty>No results found.</Command.Empty>
          <Command.Group heading="Suggestions">
            {Object.values(schema.current.tables).map((table) => (
              <Command.Item key={table.name} value={table.name}>
                <Table2 className={styles.itemIcon} />
                {table.name}
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
              <ReactFlowProvider>
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
              </ReactFlowProvider>
            )}
          </div>
        </div>
      </div>
    </Command.Dialog>
  )
}
