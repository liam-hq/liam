import { Search } from '@liam-hq/ui'
import { Command } from 'cmdk'
import { type FC, useMemo, useState } from 'react'
import styles from './CommandPaletteSearchInput.module.css'

type Props = {
  suggestion: string | null
}

export const CommandPaletteSearchInput: FC<Props> = ({ suggestion }) => {
  const [value, setValue] = useState('')

  const suggestionSuffix = useMemo(() => {
    if (!suggestion) return ''

    if (suggestion.toLowerCase().startsWith(value.toLowerCase())) {
      return suggestion.slice(value.length).toLowerCase()
    }
    return `- ${suggestion}`
  }, [value, suggestion])

  return (
    <div className={styles.container}>
      <Search className={styles.searchIcon} />
      <div className={styles.inputWithSuggestion}>
        <Command.Input
          className={styles.input}
          value={value}
          onValueChange={setValue}
          onBlur={(event) => event.target.focus()}
        />
        <div className={styles.suggestion}>
          <span className={styles.inputValue}>{value}</span>
          <span className={styles.suggestionSuffix}>{suggestionSuffix}</span>
        </div>
      </div>
    </div>
  )
}
