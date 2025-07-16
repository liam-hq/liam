import { Search } from '@liam-hq/ui'
import { Command } from 'cmdk'
import { type FC, useEffect, useMemo, useRef, useState } from 'react'
import styles from './CommandPaletteSearchInput.module.css'

type Props = { selectedOption: string | null }

export const CommandPaletteSearchInput: FC<Props> = ({ selectedOption }) => {
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
    if (!prefixTextRef.current) return

    const inputPaddingLeft = prefixTextRef.current.offsetWidth
    setInputPaddingLeft(inputPaddingLeft)
  }, [prefix])

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
