import { Button, Table2 } from '@liam-hq/ui'
import { DialogClose } from '@radix-ui/react-dialog'
import { Command, defaultFilter } from 'cmdk'
import { type FC, useCallback, useEffect, useMemo, useState } from 'react'
import { useTableSelection } from '@/features/erd/hooks'
import { useSchemaOrThrow } from '@/stores'
import { TableNode } from '../../../ERDContent/components'
import { CommandPaletteCommandOptions } from '../CommandPaletteOptions'
import { CommandPaletteSearchInput } from '../CommandPaletteSearchInput'
import type { CommandPaletteInputMode } from '../types'
import { getSuggestionText, textToSuggestion } from '../utils'
import styles from './CommandPaletteContent.module.css'

const getTableLinkHref = (activeTableName: string) => {
  const searchParams = new URLSearchParams(window.location.search)
  searchParams.set('active', activeTableName)
  return `?${searchParams.toString()}`
}

const commandPaletteFilter: typeof defaultFilter = (value, ...rest) => {
  const suggestion = textToSuggestion(value)

  // if the value is inappropriate for suggestion, it returns 0 and the options is hidden
  // https://github.com/pacocoursey/cmdk/blob/d6fde235386414196bf80d9b9fa91e2cf89a72ea/cmdk/src/index.tsx#L91-L95
  if (!suggestion) return 0

  return defaultFilter(suggestion.name, ...rest)
}

type Props = {
  closeDialog: () => void
}

export const CommandPaletteContent: FC<Props> = ({ closeDialog }) => {
  // TODO: switch inputMode with `setInputMode`
  const [inputMode, setInputMode] = useState<CommandPaletteInputMode>({
    type: 'default',
  })

  const schema = useSchemaOrThrow()
  const [suggestionText, setSuggestionText] = useState('')
  const suggestion = useMemo(
    () => textToSuggestion(suggestionText),
    [suggestionText],
  )

  const suggestedTableName =
    suggestion?.type === 'table' ? suggestion.name : null
  const table = schema.current.tables[suggestedTableName ?? '']
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
      if (!suggestedTableName) return

      if (event.key === 'Enter') {
        if (event.metaKey || event.ctrlKey) {
          window.open(getTableLinkHref(suggestedTableName))
        } else {
          goToERD(suggestedTableName)
        }
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [suggestedTableName])

  return (
    <Command
      value={suggestionText}
      onValueChange={(v) => setSuggestionText(v)}
      filter={commandPaletteFilter}
    >
      <div className={styles.searchContainer}>
        <CommandPaletteSearchInput
          mode={inputMode}
          setMode={setInputMode}
          onBlur={(event) => event.target.focus()}
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
          {inputMode.type === 'default' && (
            <Command.Group heading="Tables">
              {Object.values(schema.current.tables).map((table) => (
                <Command.Item
                  key={table.name}
                  value={getSuggestionText({ type: 'table', name: table.name })}
                  asChild
                >
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
          )}
          {(inputMode.type === 'default' || inputMode.type === 'command') && (
            <CommandPaletteCommandOptions />
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
