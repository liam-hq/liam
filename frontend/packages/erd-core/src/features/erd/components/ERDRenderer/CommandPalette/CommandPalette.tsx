'use client'

import { useTableSelection } from '@/features/erd/hooks'
import { useSchemaStore } from '@/stores'
import { Search, Table2 } from '@liam-hq/ui'
import { Command } from 'cmdk'
import { useCallback, useEffect, useState } from 'react'
import { TableNode } from '../../ERDContent/components/TableNode'
import styles from './CommandPalette.module.css'

export const CommandPalette = () => {
  const [open, setOpen] = useState(false)
  const schema = useSchemaStore()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const [tableName, setTableName] = useState<string>('')
  const { selectTable } = useTableSelection()
  const table = schema.tables[tableName ?? '']

  const jumpToERD = useCallback(
    (tableName: string) => {
      setOpen(false)
      selectTable({ tableId: tableName, displayArea: 'main' })
    },
    [selectTable],
  )

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global Command Menu"
      contentClassName={styles.content}
      value={tableName}
      onValueChange={(v) => setTableName(v)}
    >
      <div className={styles.searchContainer}>
        <Search />
        <Command.Input placeholder="Search" />
        <span className={styles.escapeSign}>ESC</span>
      </div>
      <div className={styles.main}>
        <Command.List>
          <Command.Empty>No results found.</Command.Empty>

          <Command.Group heading="Suggestions">
            {Object.values(schema.tables).map((table) => (
              <Command.Item
                key={table.name}
                value={table.name}
                onSelect={() => jumpToERD(table.name)}
              >
                <Table2 />
                {table.name}
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
        <div>
          {table && (
            <TableNode
              id=""
              type="table"
              data={{
                table: table,
                showMode: 'ALL_FIELDS',
                isActiveHighlighted: false,
                isHighlighted: false,
                sourceColumnName: undefined,
                targetColumnCardinalities: undefined,
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
    </Command.Dialog>
  )
}
