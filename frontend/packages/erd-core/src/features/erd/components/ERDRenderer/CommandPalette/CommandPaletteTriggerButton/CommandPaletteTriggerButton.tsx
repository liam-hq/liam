import { Search } from '@liam-hq/ui'
import type { FC } from 'react'
import { useCommandPalette } from '../CommandPaletteProvider'
import styles from './CommandPaletteTriggerButton.module.css'

export const CommandPaletteTriggerButton: FC = () => {
  const commandPaletteResult = useCommandPalette()
  if (commandPaletteResult.isErr()) {
    throw commandPaletteResult.error
  }
  const { setOpen } = commandPaletteResult.value

  return (
    <button
      className={styles.container}
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Open command palette to search features"
    >
      <Search className={styles.searchIcon} />
      <span className={styles.text}>Search</span>
      <span className={styles.keyIcon}>⌘</span>
      <span className={styles.keyIcon}>K</span>
    </button>
  )
}
