import { headers } from 'next/headers'
import type { FC, PropsWithChildren } from 'react'
import { safeParse } from 'valibot'
import { TabsContent, TabsRoot } from '@/components'
import { ProjectHeader } from './ProjectHeader'
import {
  PROJECT_TAB,
  ProjectTabSchema,
  type ProjectTabValue,
} from './ProjectHeader/projectConstants'
import styles from './ProjectLayout.module.css'

const getDefaultTabFromPath = async (): Promise<
  ProjectTabValue | undefined
> => {
  const headersList = await headers()
  const urlPath = headersList.get('x-url-path') || ''
  const pathSegments = urlPath.split('/')
  const lastSegment = pathSegments[pathSegments.length - 1]

  const result = safeParse(ProjectTabSchema, lastSegment)

  return result.success ? result.output : undefined
}

type Props = PropsWithChildren & {
  projectId: string
  branchOrCommit?: string
  projectHeader?: boolean
}

export const ProjectLayout: FC<Props> = async ({
  children,
  projectId,
  branchOrCommit,
  projectHeader = true,
}) => {
  const defaultTabFromPath = await getDefaultTabFromPath()

  return (
    <TabsRoot
      defaultValue={defaultTabFromPath || PROJECT_TAB.PROJECT}
      className={styles.container}
    >
      {projectHeader && (
        <ProjectHeader projectId={projectId} branchOrCommit={branchOrCommit} />
      )}
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
