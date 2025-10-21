import { Button } from '@liam-hq/ui'
import { DialogClose } from '@radix-ui/react-dialog'
import { Command, defaultFilter as cmdkBaseFilter } from 'cmdk'
import { type FC, useMemo, useState } from 'react'
import {
  CommandPaletteCommandOptions,
  TableDetailOptions,
  TableOptions,
} from '../CommandPaletteOptions'
import { CommandPreview, TablePreview } from '../CommandPalettePreview'
import { CommandPaletteSearchInput } from '../CommandPaletteSearchInput'
import type { CommandPaletteInputMode } from '../types'
import { textToSuggestion } from '../utils'
import styles from './CommandPaletteContent.module.css'

const defaultCommandPaletteFilter: typeof cmdkBaseFilter = (value, ...rest) => {
  const suggestion = textToSuggestion(value)

  // if the value is inappropriate for suggestion, it returns 0 and the options is hidden
  // https://github.com/pacocoursey/cmdk/blob/d6fde235386414196bf80d9b9fa91e2cf89a72ea/cmdk/src/index.tsx#L91-L95
  if (!suggestion) return 0

  // displays 'table' and 'command' type suggestions in the "default" input mode
  if (suggestion.type === 'table' || suggestion.type === 'command') {
    return cmdkBaseFilter(suggestion.name, ...rest)
  }

  return 0
}

const tableInputModeFilter: typeof cmdkBaseFilter = (value, ...rest) => {
  const suggestion = textToSuggestion(value)

  // if the value is inappropriate for suggestion, it returns 0 and the options is hidden
  // https://github.com/pacocoursey/cmdk/blob/d6fde235386414196bf80d9b9fa91e2cf89a72ea/cmdk/src/index.tsx#L91-L95
  if (!suggestion) return 0

  // always display the table itself on the top of the options list
  if (suggestion.type === 'table') return 1
  if (suggestion.type === 'column')
    return cmdkBaseFilter(suggestion.columnName, ...rest)
  if (suggestion.type === 'index')
    return cmdkBaseFilter(suggestion.indexName, ...rest)

  // it displays only 'table' and 'column' type suggestions in the "table" input mode
  return 0
}

type Props = {
  isTableModeActivatable?: boolean
}

export const CommandPaletteContent: FC<Props> = ({
  isTableModeActivatable = false,
}) => {
  const [inputMode, setInputMode] = useState<CommandPaletteInputMode>({
    type: 'default',
  })
  const filter = useMemo(() => {
    switch (inputMode.type) {
      case 'default':
      case 'command':
        return defaultCommandPaletteFilter
      case 'table':
        return tableInputModeFilter
    }
  }, [inputMode.type])

  const [suggestionText, setSuggestionText] = useState('')
  const suggestion = useMemo(
    () => textToSuggestion(suggestionText),
    [suggestionText],
  )

  return (
    <Command
      value={suggestionText}
      onValueChange={(v) => setSuggestionText(v)}
      filter={filter}
    >
      <div className={styles.searchContainer}>
        <CommandPaletteSearchInput
          mode={inputMode}
          suggestion={suggestion}
          setMode={setInputMode}
          onBlur={(event) => event.target.focus()}
          isTableModeActivatable={isTableModeActivatable}
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
            <TableOptions suggestion={suggestion} />
          )}
          {inputMode.type === 'table' && (
            <TableDetailOptions
              tableName={inputMode.tableName}
              suggestion={suggestion}
            />
          )}
          {(inputMode.type === 'default' || inputMode.type === 'command') && (
            <CommandPaletteCommandOptions />
          )}
        </Command.List>
        <div
          className={styles.previewContainer}
          data-testid="CommandPalettePreview"
        >
          {suggestion?.type === 'table' && (
            <TablePreview tableName={suggestion.name} />
          )}
          {(suggestion?.type === 'column' || suggestion?.type === 'index') && (
            <TablePreview tableName={suggestion.tableName} />
          )}
          {suggestion?.type === 'command' && (
            <CommandPreview commandName={suggestion.name} />
          )}
        </div>
      </div>
    </Command>
  )
}
