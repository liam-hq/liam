'use client'

import { useTableSelection } from '@/features/erd/hooks'
import { useSchemaStore } from '@/stores'
import { Search, Table2 } from '@liam-hq/ui'
import { Command, useCommandState } from 'cmdk'
import {
  type ComponentProps,
  forwardRef,
  useCallback,
  useEffect,
  useState,
} from 'react'
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
              <CustomItem
                key={table.name}
                value={table.name}
                onX={() => {
                  setTableName(table.name)
                }}
                onSelect={() => {
                  console.log('click', table.name)
                  jumpToERD(table.name)
                }}
              >
                <Table2 />
                {table.name}
              </CustomItem>
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

const CustomItem = forwardRef<
  HTMLDivElement,
  ComponentProps<typeof Command.Item>
>((props, forwardedRef) => {
  const value = props.value

  const selected = useCommandState(
    (state) => state.value && state.value === value,
  )

  useEffect(() => {
    if (!selected) return

    props.onX()
  }, [selected, props.onX])

  return <Command.Item {...props} ref={forwardedRef} />
})
