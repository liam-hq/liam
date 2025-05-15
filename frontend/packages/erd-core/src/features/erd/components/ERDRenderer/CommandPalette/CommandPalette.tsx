'use client'

import { useTableSelection } from '@/features/erd/hooks'
import { useSchemaStore } from '@/stores'
import { Command } from 'cmdk'
import { useEffect, useState } from 'react'
import { TableNode } from '../../ERDContent/components/TableNode'
import styles from './CommandPalette.module.css'

export const CommandPalette = () => {
  const [open, setOpen] = useState(false)
  const schema = useSchemaStore()

  const [tableName, setTableName] = useState<string | null>(null)
  const { selectTable } = useTableSelection()
  const table = schema.tables[tableName ?? '']

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

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global Command Menu"
      contentClassName={styles.content}
    >
      <Command.Input />
      <div className={styles.main}>
        <Command.List>
          <Command.Empty>No results found.</Command.Empty>

          <Command.Group heading="Suggestions">
            {Object.values(schema.tables).map((table) => (
              <Command.Item
                key={table.name}
                onSelect={() => {
                  setTableName(table.name)
                }}
              >
                {table.name}
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
        <div>
          {table && (
            <>
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
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  selectTable({ tableId: table.name, displayArea: 'main' })
                }}
                style={{ marginTop: 8, border: '1px solid black' }}
              >
                go to the table
              </button>
            </>
          )}
        </div>
      </div>
    </Command.Dialog>
  )
}
