import { Search } from '@liam-hq/ui'
import { Command } from 'cmdk'
import { type FC, useEffect, useMemo, useRef, useState } from 'react'
import type { InputMode } from '../types'
import styles from './CommandPaletteSearchInput.module.css'

type Props = {
  selectedOption: string | null
  inputMode: InputMode
  setInputMode: (inputMode: InputMode) => void
}

export const CommandPaletteSearchInput: FC<Props> = ({
  selectedOption,
  inputMode,
  setInputMode,
}) => {
  const inputModeTextRef = useRef<HTMLSpanElement>(null)
  const prefixTextRef = useRef<HTMLSpanElement>(null)
  const [inputPaddingLeft, setInputPaddingLeft] = useState(0)

  const [searchText, setSearchText] = useState('')

  const { prefix, suffix } = useMemo(() => {
    if (searchText === '') return { prefix: '', suffix: '' }

    const index = selectedOption
      ?.toLowerCase()
      .indexOf(searchText.toLowerCase())
    if (index === undefined) return { prefix: '', suffix: '' }

    return {
      prefix: selectedOption?.slice(0, index),
      suffix: selectedOption?.slice(
        index + searchText.length,
        selectedOption.length,
      ),
    }
  }, [searchText, selectedOption])

  useEffect(() => {
    if (selectedOption === null) return

    const down = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        setSearchText(selectedOption)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [selectedOption])

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
          placeholder="Search"
          onBlur={(event) => event.target.focus()}
          className={styles.input}
          style={{ paddingLeft: inputPaddingLeft }}
        />
        <div className={styles.suggestion}>
          {inputMode.type !== 'default' && (
            <span ref={inputModeTextRef} className={styles.inputModeIndicator}>
              {inputMode.type === 'table' && inputMode.name}
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
