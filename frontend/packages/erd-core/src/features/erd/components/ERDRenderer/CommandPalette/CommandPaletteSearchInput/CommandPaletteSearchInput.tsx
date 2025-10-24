import { Search } from '@liam-hq/ui'
import { Command } from 'cmdk'
import {
  type ComponentProps,
  type FC,
  type KeyboardEventHandler,
  useCallback,
  useMemo,
  useState,
} from 'react'
import type {
  CommandPaletteInputMode,
  CommandPaletteSuggestion,
} from '../types'
import styles from './CommandPaletteSearchInput.module.css'

type Props = ComponentProps<typeof Command.Input> & {
  mode: CommandPaletteInputMode
  suggestion: CommandPaletteSuggestion | null
  setMode: (mode: CommandPaletteInputMode) => void

  // TODO: remove this prop and always activate table mode when releasing the feature
  isTableModeActivatable?: boolean
}

export const CommandPaletteSearchInput: FC<Props> = ({
  mode,
  suggestion,
  setMode,
  isTableModeActivatable = false,
  ...inputProps
}) => {
  const [value, setValue] = useState('')

  const modePrefix = useMemo(() => {
    switch (mode.type) {
      case 'default':
        return null
      case 'command':
        return '>'
      case 'table':
        return `${mode.tableName} /`
    }
  }, [mode])

  const suggestionValue = useMemo(() => {
    // TODO: remove this statement when releasing the feature
    if (!isTableModeActivatable) return null

    if (!suggestion) return null

    // no need to show completion cases
    if (mode.type === 'table' && suggestion.type === 'table') {
      return null
    }
    return suggestion.type === 'column'
      ? suggestion.columnName
      : suggestion.type === 'index'
        ? suggestion.indexName
        : suggestion.name
  }, [mode, suggestion, isTableModeActivatable])

  const completionSuffix = useMemo(() => {
    if (!suggestionValue) return

    if (suggestionValue.startsWith(value)) {
      return suggestionValue.slice(value.length)
    }

    return ` - ${suggestionValue}`
  }, [value, suggestionValue])

  const handleKeydown: KeyboardEventHandler<HTMLInputElement> = useCallback(
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: refactor this function to reduce cognitive complexity
    (event) => {
      switch (mode.type) {
        case 'default': {
          // switch to "command" mode if value is empty and `>` is pressed
          if (event.key === '>' && value === '') {
            event.preventDefault()
            setMode({ type: 'command' })
            return
          }

          // TODO: remove this condition and always activate table mode when releasing the feature
          if (isTableModeActivatable) {
            if (event.key === 'Tab' && suggestion?.type === 'table') {
              // switch to "table" mode if a table is suggested and Tab key is pressed
              event.preventDefault()
              setMode({ type: 'table', tableName: suggestion.name })
              setValue('')
              return
            }
          }

          break
        }

        case 'command':
        case 'table': {
          // switch to "default" mode if value is empty and delete key is pressed
          if (event.key === 'Backspace' && value === '') {
            event.preventDefault()
            setMode({ type: 'default' })
            return
          }

          break
        }
      }

      // TODO: remove this condition and always activate table mode when releasing the feature
      if (isTableModeActivatable) {
        // it completes input value with suggestion when Tab key is pressed but the the input mode is not "default" or the suggestion type is not "table"
        if (event.key === 'Tab' && suggestionValue) {
          event.preventDefault()
          setValue(suggestionValue)
          return
        }
      }
    },
    [
      mode.type,
      value,
      setMode,
      suggestion,
      isTableModeActivatable,
      suggestionValue,
    ],
  )

  return (
    <div className={styles.container}>
      <Search className={styles.searchIcon} />
      <div className={styles.inputContainer}>
        {modePrefix && <span className={styles.modePrefix}>{modePrefix}</span>}
        <div className={styles.inputWithSuggestion}>
          <Command.Input
            {...inputProps}
            value={value}
            onValueChange={setValue}
            className={styles.input}
            placeholder={completionSuffix ? '' : 'Search'} // display completion suffix instead when suggested
            autoFocus
            onKeyDown={handleKeydown}
          />
          {completionSuffix && (
            <div className={styles.suggestion}>
              <span className={styles.inputValue}>{value}</span>
              <span
                className={styles.completionSuffix}
                data-testid="command-palette-search-input-suggestion-suffix"
              >
                {completionSuffix}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
