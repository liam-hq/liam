import {
  Button,
  Copy,
  KeyRound,
  PanelTop,
  RectangleHorizontal,
  Table2,
} from '@liam-hq/ui'
import { DialogClose } from '@radix-ui/react-dialog'
import { Command } from 'cmdk'
import { type FC, useCallback, useEffect, useState } from 'react'
import { useTableSelection } from '@/features/erd/hooks'
import { useSchemaOrThrow, useUserEditingOrThrow } from '@/stores'
import { TableNode } from '../../../ERDContent/components'
import { CommandPaletteSearchInput } from '../CommandPaletteSearchInput'
import type { InputMode, Suggestion } from '../types'
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
  const [inputMode, setInputMode] = useState<InputMode>({ type: 'default' })
  const [selectedOption, setSelectedOption] = useState<Suggestion | null>(null)

  const { setShowMode } = useUserEditingOrThrow()

  const schema = useSchemaOrThrow()
  const table =
    schema.current.tables[
      inputMode?.type === 'column'
        ? inputMode.tableName
        : inputMode?.type === 'default'
          ? selectedOption?.type === 'table'
            ? selectedOption.name
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
      if (!selectedOption) return

      if (selectedOption.type === 'table') {
        const tableName = selectedOption.name
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
  }, [selectedOption])

  return (
    <Command
      value={
        selectedOption ? `${selectedOption.type}|${selectedOption.name}` : ''
      }
      onValueChange={(v) => {
        const [type, name] = v.split('|')
        if (name === undefined) {
          setSelectedOption(null)
          return
        }
        if (type === 'command' || type === 'table') {
          setSelectedOption({ type, name })
        } else if (type === 'column') {
          setSelectedOption((prev) =>
            prev?.type === 'table'
              ? { type: 'column', tableName: prev.name, name }
              : prev?.type === 'column'
                ? { ...prev, name }
                : null,
          )
        } else {
          setSelectedOption(null)
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
          suggestion={selectedOption}
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
          {inputMode.type === 'default' && (
            <Command.Group heading="Tables">
              {Object.values(schema.current.tables).map((table) => (
                <Command.Item
                  key={table.name}
                  value={`table|${table.name}`}
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
          {inputMode.type === 'column' && (
            <Command.Group heading="Tables">
              <Command.Item value={'column|'} asChild>
                <a
                  href={getTableLinkHref(inputMode.tableName)}
                  onClick={(event) => {
                    // Do not call preventDefault to allow the default link behavior when ⌘ key is pressed
                    if (event.ctrlKey || event.metaKey) {
                      return
                    }

                    event.preventDefault()
                    goToERD(inputMode.tableName)
                  }}
                >
                  <Table2 className={styles.itemIcon} />
                  <span className={styles.itemText}>{inputMode.tableName}</span>
                </a>
              </Command.Item>
              {table?.columns &&
                Object.values(table?.columns).map((column) => (
                  <Command.Item
                    key={column.name}
                    value={`column|${column.name}`}
                    asChild
                  >
                    <a
                      href={getTableLinkHref(inputMode.tableName)}
                      onClick={(event) => {
                        // Do not call preventDefault to allow the default link behavior when ⌘ key is pressed
                        if (event.ctrlKey || event.metaKey) {
                          return
                        }

                        event.preventDefault()
                        goToERD(inputMode.tableName)
                      }}
                      className={styles.column}
                    >
                      <KeyRound className={styles.itemIcon} />
                      <span className={styles.itemText}>{column.name}</span>
                    </a>
                  </Command.Item>
                ))}
            </Command.Group>
          )}
          {(inputMode.type === 'default' || inputMode.type === 'command') && (
            <Command.Group heading="Command">
              <Command.Item
                value="command|Copy Link"
                onSelect={() => navigator.clipboard.writeText(location.href)}
              >
                <Copy className={styles.itemIcon} />
                <span className={styles.itemText}>Copy Link</span>
              </Command.Item>
              <Command.Item
                value="command|Show All Fields"
                onSelect={() => {
                  setShowMode('ALL_FIELDS')
                  closeDialog()
                }}
              >
                <PanelTop className={styles.itemIcon} />
                <span className={styles.itemText}>Show All Fields</span>
              </Command.Item>
              <Command.Item
                value="command|Show Table Name"
                onSelect={() => {
                  setShowMode('TABLE_NAME')
                  closeDialog()
                }}
              >
                <RectangleHorizontal className={styles.itemIcon} />
                <span className={styles.itemText}>Show Table Name</span>
              </Command.Item>
              <Command.Item
                value="command|Show Key Only"
                onSelect={() => {
                  setShowMode('KEY_ONLY')
                  closeDialog()
                }}
              >
                <KeyRound className={styles.itemIcon} />
                <span className={styles.itemText}>Show Key Only</span>
              </Command.Item>
            </Command.Group>
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
