import type { FC } from 'react'
import { TabsList, TabsTrigger } from '@/components'
import type { Version } from '../../../../types'
import { OUTPUT_TABS_LIST } from '../../constants'
import { ExportDropdown } from './ExportDropdown'
import styles from './Header.module.css'
import { VersionDropdown } from './VersionDropdown'

type Props = {
  designSessionId: string
  currentVersion: Version | null
  onCurrentVersionChange: (version: Version) => void
}

export const Header: FC<Props> = ({
  designSessionId,
  currentVersion,
  onCurrentVersionChange,
}) => {
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
        <VersionDropdown
          designSessionId={designSessionId}
          currentVersion={currentVersion}
          onCurrentVersionChange={onCurrentVersionChange}
        />
      </div>
    </div>
  )
}
