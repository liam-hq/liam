import { urlgen } from '@/libs/routes/urlgen'
import { TabsList, TabsTrigger } from '@liam-hq/ui'
import Link from 'next/link'
import type { FC } from 'react'
import { match } from 'ts-pattern'
import { SETTINGS_TABS } from '../../constants'
import styles from './SettingsHeader.module.css'

export const SettingsHeader: FC = () => {
  return (
    <div className={styles.wrapper}>
      <TabsList className={styles.tabsList}>
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon
          const href = match(tab.value)
            .with('general', () => urlgen('settings/general'))
            .with('billing', () => urlgen('settings/billing'))
            .with('members', () => urlgen('settings/members'))
            .with('projects', () => urlgen('settings/projects'))
            .exhaustive()

          return (
            <Link href={href} key={tab.value}>
              <TabsTrigger value={tab.value} className={styles.tabsTrigger}>
                <Icon size={16} />
                {tab.label}
              </TabsTrigger>
            </Link>
          )
        })}
      </TabsList>
    </div>
  )
}
