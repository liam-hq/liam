import { updatePaletteOpen } from '@/stores'
import { Search } from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './CommandPalette.module.css'
import { CmdIcon, KIcon } from './Icons'

export const CommandPaletteTriggerButton: FC = () => {
  return (
    <button
      type="button"
      className={styles.triggerButtonContainer}
      onClick={() => updatePaletteOpen(true)}
    >
      <Search />
      Search
      <span className={styles.rightSide}>
        <CmdIcon />
        <KIcon />
      </span>
    </button>
  )
}
