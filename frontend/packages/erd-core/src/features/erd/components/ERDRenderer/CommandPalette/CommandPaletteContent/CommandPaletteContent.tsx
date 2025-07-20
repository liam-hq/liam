import { Button } from '@liam-hq/ui'
import { DialogClose } from '@radix-ui/react-dialog'
import { Command } from 'cmdk'
import { type FC, useCallback, useEffect, useState } from 'react'
import { useTableSelection } from '@/features/erd/hooks'
import { useSchemaOrThrow } from '@/stores'
import { TableNode } from '../../../ERDContent/components'
import { CommandPaletteSearchInput } from '../CommandPaletteSearchInput'
import type { InputMode, Suggestion } from '../types'
import { ColumnOptions } from './ColumnOptions'
import { CommandOptions } from './CommandOptions'
import styles from './CommandPaletteContent.module.css'
import { getTableLinkHref, TableOptions } from './TableOptions'

type Props = {
  closeDialog: () => void
}

export const CommandPaletteContent: FC<Props> = ({ closeDialog }) => {
  const [inputMode, setInputMode] = useState<InputMode>({ type: 'default' })
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)

  const schema = useSchemaOrThrow()
  const table =
    schema.current.tables[
      inputMode?.type === 'column'
        ? inputMode.tableName
        : inputMode?.type === 'default'
          ? suggestion?.type === 'table'
            ? suggestion.name
            : ''
          : ''
    ]
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
      if (!suggestion) return

      if (suggestion.type === 'table') {
        const tableName = suggestion.name
        if (event.key === 'Enter') {
          if (event.metaKey || event.ctrlKey) {
            window.open(getTableLinkHref(tableName))
          } else {
            goToERD(tableName)
          }
        }
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [suggestion])

  return (
    <Command
      value={suggestion ? `${suggestion.type}|${suggestion.name}` : ''}
      onValueChange={(v) => {
        const [type, name] = v.split('|')
        if (name === undefined) {
          setSuggestion(null)
          return
        }
        if (type === 'command' || type === 'table') {
          setSuggestion({ type, name })
        } else if (type === 'column') {
          setSuggestion((prev) =>
            prev?.type === 'table'
              ? { type: 'column', tableName: prev.name, name }
              : prev?.type === 'column'
                ? { ...prev, name }
                : null,
          )
        } else {
          setSuggestion(null)
        }
      }}
      filter={(value, search) => {
        return value === 'column|'
          ? 1
          : value.split('|')[1]?.toLowerCase().includes(search.toLowerCase())
            ? 1
            : 0
      }}
    >
      <div className={styles.searchArea}>
        <CommandPaletteSearchInput
          suggestion={suggestion}
          inputMode={inputMode}
          setInputMode={setInputMode}
        />
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
          {inputMode.type === 'default' && <TableOptions goToERD={goToERD} />}
          {inputMode.type === 'column' && table && (
            <ColumnOptions table={table} goToERD={goToERD} />
          )}
          {(inputMode.type === 'default' || inputMode.type === 'command') && (
            <CommandOptions />
          )}
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
                selectable={false}
                deletable={false}
                selected={false}
                draggable={false}
                zIndex={0}
              />
            )}
          </div>
        </div>
      </div>
    </Command>
  )
}
