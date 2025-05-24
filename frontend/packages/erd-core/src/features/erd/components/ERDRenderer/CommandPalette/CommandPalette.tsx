'use client'

import { useTableSelection } from '@/features/erd/hooks'
import {
  escapeActiveTableName,
  updatePaletteOpen,
  useCommandPaletteStore,
  useSchemaStore,
} from '@/stores'
import { Search, Table2 } from '@liam-hq/ui'
import * as Dialog from '@radix-ui/react-dialog'
import { Command } from 'cmdk'
import { type FC, useCallback, useEffect, useState } from 'react'
import { TableNode } from '../../ERDContent/components/TableNode'
import styles from './CommandPalette.module.css'

export const CommandPalette: FC = () => {
  const schema = useSchemaStore()
  const { open } = useCommandPaletteStore()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        updatePaletteOpen(true)
        setTableName(null)
        setSuperSelected(false)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  useEffect(() => {
    if (!open) return

    const restore = escapeActiveTableName()
    return restore
  }, [open])

  const [tableName, setTableName] = useState<string | null>(null)
  const { selectTable } = useTableSelection()
  const [superSelected, setSuperSelected] = useState(false)
  const superSelectedTableName = superSelected ? tableName : undefined

  const table = schema.tables[tableName ?? '']

  const jumpToERD = useCallback(
    (tableName: string) => {
      updatePaletteOpen(false)
      setSuperSelected(false)
      selectTable({ tableId: tableName, displayArea: 'main' })
    },
    [selectTable],
  )

  return (
    <Command.Dialog
      open={open}
      onOpenChange={updatePaletteOpen}
      contentClassName={styles.content}
      value={tableName ?? ''}
      onValueChange={(v) => {
        if (!superSelected) setTableName(v)
      }}
    >
      <Dialog.Title hidden>Command Palette</Dialog.Title>
      <Dialog.Description hidden>find tables</Dialog.Description>
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
                data-super-selected={
                  superSelectedTableName === table.name ? 'true' : undefined
                }
              >
                {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                <div
                  className={styles.itemInner}
                  onClick={(event) => {
                    event.stopPropagation()
                    if (superSelectedTableName === table.name)
                      setSuperSelected((state) => !state)
                    else {
                      setSuperSelected(true)
                      setTableName(table.name)
                    }
                  }}
                  onDoubleClick={(event) => {
                    event.stopPropagation()
                    jumpToERD(table.name)
                  }}
                >
                  <Table2 />
                  {table.name}
                </div>
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
        <div>
          <div className={styles.previewContainer}>
            {table && (
              <div className={styles.tableNodeContainer}>
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
              </div>
            )}
          </div>
        </div>
      </div>
    </Command.Dialog>
  )
}
