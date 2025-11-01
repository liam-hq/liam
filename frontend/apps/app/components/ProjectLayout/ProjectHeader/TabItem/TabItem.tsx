'use client'

import { BookMarked, ErdIcon, MessagesSquare } from '@liam-hq/ui'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type FC, useMemo } from 'react'
import { match } from 'ts-pattern'
import { urlgen } from '../../../../libs/routes'
import type { ProjectTab, ProjectTabValue } from '../projectConstants'
import styles from './TabItem.module.css'

function getActiveTabFromPath(pathname: string): ProjectTabValue {
  if (pathname.endsWith('/sessions')) return 'sessions'
  if (pathname.includes('/schema/')) return 'schema'
  return 'project'
}

function getIconComponent(tabValue: ProjectTabValue) {
  return match(tabValue)
    .with('project', () => BookMarked)
    .with('schema', () => ErdIcon)
    .with('sessions', () => MessagesSquare)
    .exhaustive()
}

type Props = {
  item: ProjectTab
  projectId: string
  branchOrCommit: string
  schemaFilePath?: string
}

export const TabItem: FC<Props> = ({
  item,
  projectId,
  branchOrCommit,
  schemaFilePath,
}) => {
  const pathname = usePathname()
  const activeTab = getActiveTabFromPath(pathname)

  const Icon = getIconComponent(item.value)
  const isSchemaTab = item.value === 'schema'
  const isDisabled = isSchemaTab && !schemaFilePath
  const isActive = item.value === activeTab

  const href = useMemo(() => {
    return match(item.value)
      .with('project', () =>
        urlgen('projects/[projectId]/ref/[branchOrCommit]', {
          projectId,
          branchOrCommit,
        }),
      )
      .with('schema', () =>
        urlgen(
          'projects/[projectId]/ref/[branchOrCommit]/schema/[...schemaFilePath]',
          {
            projectId,
            branchOrCommit,
            schemaFilePath: schemaFilePath || '',
          },
        ),
      )
      .with('sessions', () =>
        urlgen('projects/[projectId]/ref/[branchOrCommit]/sessions', {
          projectId,
          branchOrCommit,
        }),
      )
      .exhaustive()
  }, [item, projectId, branchOrCommit, schemaFilePath])

  return (
    <Link
      href={href}
      data-active={isActive}
      aria-disabled={isDisabled}
      tabIndex={isDisabled ? -1 : undefined}
      className={styles.link}
    >
      <Icon size={16} />
      {item.label}
    </Link>
  )
}
