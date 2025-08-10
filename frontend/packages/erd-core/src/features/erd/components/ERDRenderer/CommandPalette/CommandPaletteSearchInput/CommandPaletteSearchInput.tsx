import { Search } from '@liam-hq/ui'
import { Command } from 'cmdk'
import type { FC } from 'react'
import styles from './CommandPaletteSearchInput.module.css'

type Props = {}

export const CommandPaletteSearchInput: FC<Props> = () => {
  return (
    <div className={styles.container}>
      <Search className={styles.searchIcon} />
      <Command.Input
        placeholder="Search"
        onBlur={(event) => event.target.focus()}
      />
    </div>
  )
}
