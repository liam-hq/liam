import { TabsList, TabsTrigger } from '@/components'
import type { FC } from 'react'
import { OUTPUT_TABS_LIST } from '../../constants'
import { ExportDropdown } from './ExportDropdown'
import styles from './Header.module.css'
import { VersionDropdown } from './VersionDropdown'

export const Header: FC = () => {
  return (
    <div className={styles.wrapper}>
      <TabsList className={styles.tabsList}>
        {OUTPUT_TABS_LIST.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={styles.tabsTrigger}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <div className={styles.tail}>
        <ExportDropdown />
        <VersionDropdown />
      </div>
    </div>
  )
}
