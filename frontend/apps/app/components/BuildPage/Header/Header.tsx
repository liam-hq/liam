import type { FC } from 'react'
import { ExportDropdown } from './ExportDropdown'
import styles from './Header.module.css'
import { VersionDropdown } from './VersionDropdown'

export const Header: FC = () => {
  return (
    <div className={styles.wrapper}>
      <ExportDropdown />
      <VersionDropdown />
    </div>
  )
}
