import { Search } from '@liam-hq/ui'
import { Command } from 'cmdk'
import { type FC, useEffect, useMemo, useRef, useState } from 'react'
import type { InputMode, Suggestion } from '../types'
import styles from './CommandPaletteSearchInput.module.css'

type Props = {
  suggestion: Suggestion | null
  inputMode: InputMode
  setInputMode: (inputMode: InputMode) => void
}

export const CommandPaletteSearchInput: FC<Props> = ({
  suggestion,
  inputMode,
  setInputMode,
}) => {
  const inputModeTextRef = useRef<HTMLSpanElement>(null)
  const prefixTextRef = useRef<HTMLSpanElement>(null)
  const [inputPaddingLeft, setInputPaddingLeft] = useState(0)

  const [searchText, setSearchText] = useState('')

  const { prefix, suffix } = useMemo(() => {
    if (searchText === '' || suggestion === null)
      return { prefix: '', suffix: '' }

    const index = suggestion.name
      ?.toLowerCase()
      .indexOf(searchText.toLowerCase())
    if (index === undefined) return { prefix: '', suffix: '' }

    return {
      prefix: suggestion.name.slice(0, index),
      suffix: suggestion.name.slice(
        index + searchText.length,
        suggestion.name.length,
      ),
    }
  }, [searchText, suggestion])

  useEffect(() => {
    const inputPaddingLeft =
      (prefixTextRef.current?.offsetWidth ?? 0) +
      (inputModeTextRef.current?.offsetWidth ?? 0)
    setInputPaddingLeft(inputPaddingLeft)
  }, [inputMode, prefix])

  return (
    <div className={styles.container}>
      <Search className={styles.searchIcon} />
      <div className={styles.inputWithSuggestion}>
        <Command.Input
          value={searchText}
          onValueChange={setSearchText}
          onKeyDown={(event) => {
            if (event.key === 'Backspace' && searchText === '') {
              setInputMode({ type: 'default' })
            }
            if (event.key === '>' && inputMode.type === 'default') {
              setInputMode({ type: 'command' })
              event.preventDefault()
            }
            if (event.key === 'Tab' && suggestion) {
              setInputMode(suggestion)
              if (suggestion.type === 'command') {
                setSearchText(suggestion.name)
              } else if (suggestion.type === 'table') {
                setSearchText('')
              }
              event.preventDefault()
            }
          }}
          placeholder="Search"
          onBlur={(event) => event.target.focus()}
          className={styles.input}
          style={{ paddingLeft: inputPaddingLeft }}
        />
        <div className={styles.suggestion}>
          {inputMode.type !== 'default' && (
            <span ref={inputModeTextRef} className={styles.inputModeIndicator}>
              {inputMode.type === 'table' && `${inputMode.name} /`}
              {inputMode.type === 'command' && '>'}
            </span>
          )}
          <span ref={prefixTextRef} className={styles.completeSuggestion}>
            {prefix}
          </span>
          <span className={styles.completeInputText}>{searchText}</span>
          <span className={styles.completeSuggestion}>{suffix}</span>
        </div>
      </div>
    </div>
  )
}
