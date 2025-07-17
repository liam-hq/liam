import type { ComponentProps, FC } from 'react'
import { TabsList, TabsTrigger } from '@/components'
import { OUTPUT_TABS_LIST } from '../../constants'
import { ExportDropdown } from './ExportDropdown'
import styles from './Header.module.css'
import { VersionDropdown } from './VersionDropdown'

type Props = ComponentProps<typeof VersionDropdown>

export const Header: FC<Props> = ({ ...propsForVersionDropdown }) => {
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
        <VersionDropdown {...propsForVersionDropdown} />
      </div>
    </div>
  )
}
