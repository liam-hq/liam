'use client'

import { useTableSelection } from '@/features/erd/hooks'
import { useSchemaStore } from '@/stores'
import { Search, Table2 } from '@liam-hq/ui'
import { Command, useCommandState } from 'cmdk'
import {
  type FC,
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { TableNode } from '../../ERDContent/components/TableNode'
import styles from './CommandPalette.module.css'

const commandPaletteContext = createContext({
  setOpen: (_: boolean | ((_: boolean) => boolean)) => {},
})

export const CommandPaletteWrapper: FC<PropsWithChildren> = (props) => {
  const [open, setOpen] = useState(false)

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
    <commandPaletteContext.Provider value={{ setOpen }}>
      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Global Command Menu"
        contentClassName={styles.content}
      >
        {props.children}
      </Command.Dialog>
    </commandPaletteContext.Provider>
  )
}

export const CommandPalette = () => {
  const { setOpen } = useContext(commandPaletteContext)
  const schema = useSchemaStore()

  const [tableName, setTableName] = useState<string | null>(null)
  const { selectTable } = useTableSelection()
  const table = schema.tables[tableName ?? '']

  const jumpToERD = useCallback(
    (tableName: string) => {
      setOpen(false)
      selectTable({ tableId: tableName, displayArea: 'main' })
    },
    [setOpen, selectTable],
  )

  const selectedItem = useCommandState((state) => state.value)
  useEffect(() => {
    setTableName(selectedItem)
    return () => setTableName(null)
  }, [selectedItem])

  return (
    <>
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
    </>
  )
}
