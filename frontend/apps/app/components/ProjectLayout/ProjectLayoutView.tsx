'use client'

import { TabsContent, TabsRoot } from '@liam-hq/ui'
import type { FC, PropsWithChildren, ReactNode } from 'react'
import {
  PROJECT_TAB,
  type ProjectTabValue,
} from './ProjectHeader/projectConstants'
import styles from './ProjectLayout.module.css'

type Props = PropsWithChildren & {
  projectHeader?: ReactNode
  defaultTabValue?: ProjectTabValue
}

export const ProjectLayoutView: FC<Props> = ({
  children,
  projectHeader,
  defaultTabValue = PROJECT_TAB.PROJECT,
}) => {
  return (
    <TabsRoot defaultValue={defaultTabValue} className={styles.container}>
      {projectHeader}
      <TabsContent value={PROJECT_TAB.PROJECT} className={styles.tabContent}>
        {children}
      </TabsContent>
      <TabsContent value={PROJECT_TAB.SCHEMA} className={styles.tabContent}>
        {children}
      </TabsContent>
      <TabsContent value={PROJECT_TAB.SESSIONS} className={styles.tabContent}>
        {children}
      </TabsContent>
    </TabsRoot>
  )
}
