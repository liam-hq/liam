import { ChevronLeft } from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './ShowModeMenu.module.css'
import { ShowModeMenuRadioGroup } from './ShowModeMenuRadioGroup'

type Props = {
  toggleOpenClose: () => void
  toggleShowModeMenu: () => void
}

export const ShowModeMenu: FC<Props> = ({
  toggleOpenClose,
  toggleShowModeMenu,
}) => {
  return (
    <div className={styles.wrapper}>
      <button type="button" onClick={toggleShowModeMenu}>
        <div className={styles.backButton}>
          <div className={styles.cheveron}>
            <ChevronLeft size={12} color="var(--global-foreground, #fff)" />
          </div>
          <div className={styles.text}>show</div>
        </div>
      </button>

      <hr className={styles.divider} />

      <ShowModeMenuRadioGroup />

      <button
        type="button"
        className={styles.closeButton}
        onClick={toggleOpenClose}
      >
        Close
      </button>
    </div>
  )
}
