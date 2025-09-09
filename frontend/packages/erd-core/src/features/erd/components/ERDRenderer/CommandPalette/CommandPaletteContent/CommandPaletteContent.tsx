import { Button } from '@liam-hq/ui'
import { DialogClose } from '@radix-ui/react-dialog'
import { Command, defaultFilter } from 'cmdk'
import { type FC, useMemo, useState } from 'react'
import { TableOptions } from '../CommandPaletteOptions'
import { TablePreview } from '../CommandPalettePreview'
import { CommandPaletteSearchInput } from '../CommandPaletteSearchInput'
import type { CommandPaletteInputMode } from '../types'
import { textToSuggestion } from '../utils'
import styles from './CommandPaletteContent.module.css'

const commandPaletteFilter: typeof defaultFilter = (value, ...rest) => {
  const suggestion = textToSuggestion(value)

  // if the value is inappropriate for suggestion, it returns 0 and the options is hidden
  // https://github.com/pacocoursey/cmdk/blob/d6fde235386414196bf80d9b9fa91e2cf89a72ea/cmdk/src/index.tsx#L91-L95
  if (!suggestion) return 0

  return defaultFilter(suggestion.name, ...rest)
}

export const CommandPaletteContent: FC = () => {
  // TODO: switch inputMode with `setInputMode`
  const [inputMode, setInputMode] = useState<CommandPaletteInputMode>({
    type: 'default',
  })

  const [suggestionText, setSuggestionText] = useState('')
  const suggestion = useMemo(
    () => textToSuggestion(suggestionText),
    [suggestionText],
  )

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
            <TableOptions suggestion={suggestion} />
          )}
          {
            (inputMode.type === 'default' || inputMode.type === 'command') &&
              null
            // TODO(command options): uncomment the following line to release command options
            // <CommandPaletteCommandOptions />
          }
        </Command.List>
        <div
          className={styles.previewContainer}
          data-testid="CommandPalettePreview"
        >
          {suggestion?.type === 'table' && (
            <TablePreview tableName={suggestion.name} />
          )}
          {
            suggestion?.type === 'command' && null
            // TODO(command options): uncomment the following line to release command preview
            // <CommandPreview commandName={suggestion.name} />
          }
        </div>
      </div>
    </Command>
  )
}
