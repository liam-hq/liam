import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '@/components'
import { Map as ErdMap, Table2 } from 'lucide-react'
import type { FC, ReactNode } from 'react'
import styles from './Preview.module.css'

export type TabItem = {
  trigger: {
    type: 'TABLE' | 'ERD'
    label: string
  }
  content: ReactNode
}

type Props = {
  items: TabItem[]
  value?: string
  onValueChange?: (value: string) => void
}

export const Preview: FC<Props> = ({ items, value, onValueChange }) => {
  return (
    <TabsRoot
      className={styles.tabsRoot}
      value={value}
      onValueChange={onValueChange}
    >
      <TabsList className={styles.tabsList}>
        {items.map(({ trigger }) => (
          <TabsTrigger
            key={trigger.label}
            value={trigger.label}
            className={styles.tabsTrigger}
          >
            {trigger.type === 'TABLE' ? (
              <Table2 className={styles.icon} />
            ) : (
              <ErdMap className={styles.icon} />
            )}
            <span className={styles.label}>{trigger.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>
      {items.map(({ trigger, content }) => (
        <TabsContent
          key={trigger.label}
          value={trigger.label}
          className={styles.tabsContent}
        >
          {content}
        </TabsContent>
      ))}
    </TabsRoot>
  )
}
