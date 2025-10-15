'use client'

import { TabsList, TabsTrigger } from '@liam-hq/ui'
import Link from 'next/link'
import type { FC } from 'react'
import type { FormatType } from '../../FormatIcon/FormatIcon'
import styles from './ProjectHeader.module.css'
import { PROJECT_TABS } from './projectConstants'

type Props = {
  projectId: string
  branchOrCommit: string
  project: {
    name: string
    schemaPath: {
      path: string
      format: FormatType
    } | null
  }
  urlgen: (route: string, params: Record<string, string | string[]>) => string
}

export const ProjectHeaderView: FC<Props> = ({
  projectId,
  branchOrCommit,
  project,
  urlgen,
}) => {
  return (
    <div className={styles.wrapper}>
      <TabsList className={styles.tabsList}>
        {PROJECT_TABS.map((tab) => {
          const Icon = tab.icon
          const isSchemaTab = tab.value === 'schema'
          const isDisabled = isSchemaTab && !project.schemaPath
          let href: string

          switch (tab.value) {
            case 'project':
              href = urlgen('projects/[projectId]/ref/[branchOrCommit]', {
                projectId,
                branchOrCommit,
              })
              break
            case 'schema':
              href = urlgen(
                'projects/[projectId]/ref/[branchOrCommit]/schema/[...schemaFilePath]',
                {
                  projectId,
                  branchOrCommit,
                  schemaFilePath: project.schemaPath?.path || '',
                },
              )
              break
            case 'sessions':
              href = urlgen(
                'projects/[projectId]/ref/[branchOrCommit]/sessions',
                {
                  projectId,
                  branchOrCommit,
                },
              )
              break
          }

          const tabTrigger = (
            <TabsTrigger
              value={tab.value}
              className={styles.tabsTrigger}
              disabled={isDisabled}
              aria-disabled={isDisabled}
            >
              <Icon size={16} />
              {tab.label}
            </TabsTrigger>
          )

          return (
            <Link
              href={href}
              key={tab.value}
              aria-disabled={isDisabled}
              tabIndex={isDisabled ? -1 : undefined}
            >
              {tabTrigger}
            </Link>
          )
        })}
      </TabsList>
    </div>
  )
}
