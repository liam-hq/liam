import { Search } from '@liam-hq/ui'
import { Command } from 'cmdk'
import type { FC } from 'react'
import styles from './CommandPaletteSearchInput.module.css'

export const CommandPaletteSearchInput: FC = () => {
  return (
    <div className={styles.container}>
      <Search className={styles.searchIcon} />
      <Command.Input
        placeholder="Search"
        onBlur={(event) => event.target.focus()}
        className={styles.input}
      />
    </div>
  )
}
