import { Button, Table2 } from '@liam-hq/ui'
import { DialogClose } from '@radix-ui/react-dialog'
import { Command } from 'cmdk'
import { type FC, useCallback, useEffect, useState } from 'react'
import { useTableSelection } from '@/features/erd/hooks'
import { useSchema } from '@/stores'
import { TableNode } from '../../../ERDContent/components'
import { CommandPaletteSearchInput } from '../CommandPaletteSearchInput'
import styles from './CommandPaletteContent.module.css'

const getTableLinkHref = (activeTableName: string) => {
  const searchParams = new URLSearchParams(window.location.search)
  searchParams.set('active', activeTableName)
  return `?${searchParams.toString()}`
}

type Props = {
  closeDialog: () => void
}

export const CommandPaletteContent: FC<Props> = ({ closeDialog }) => {
  const schema = useSchema()
  const [tableName, setTableName] = useState<string | null>(null)
  const table = schema.current.tables[tableName ?? '']
  const { selectTable } = useTableSelection()

  const goToERD = useCallback(
    (tableName: string) => {
      selectTable({ tableId: tableName, displayArea: 'main' })
      closeDialog()
    },
    [selectTable, closeDialog],
  )

  // Select option by pressing [Enter] key (with/without ⌘ key)
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (!tableName) return

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
  }, [tableName])

  return (
    <Command value={tableName ?? ''} onValueChange={(v) => setTableName(v)}>
      <div className={styles.searchArea}>
        <CommandPaletteSearchInput />
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
    </Command>
  )
}
