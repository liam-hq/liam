import type { ComponentProps, FC } from 'react'
import { TabsList, TabsTrigger } from '@/components'
import { ARTIFACT_TAB, ERD_SCHEMA_TABS_LIST } from '../../constants'
import { ExportDropdown } from './ExportDropdown'
import styles from './Header.module.css'
import { VersionDropdown } from './VersionDropdown'

type Props = ComponentProps<typeof VersionDropdown>

export const Header: FC<Props> = ({ ...propsForVersionDropdown }) => {
  return (
    <div className={styles.wrapper}>
      <TabsList className={styles.tabsList}>
        <div className={styles.erdSchemaTabsGroup}>
          <div className={styles.erdSchemaTabs}>
            {ERD_SCHEMA_TABS_LIST.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={styles.erdSchemaTrigger}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </div>
          <div className={styles.divider} />
          <VersionDropdown {...propsForVersionDropdown} />
        </div>
        <TabsTrigger
          value={ARTIFACT_TAB.value}
          className={styles.artifactTrigger}
        >
          {ARTIFACT_TAB.label}
        </TabsTrigger>
      </TabsList>
      <div className={styles.tail}>
        <ExportDropdown />
      </div>
    </div>
  )
}
