import { Download } from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './ExportButton.module.css'

export const ExportButton: FC = () => {
  return (
    <button type="button" className={styles.iconWrapper}>
      <Download className={styles.icon} />
    </button>
  )
}
