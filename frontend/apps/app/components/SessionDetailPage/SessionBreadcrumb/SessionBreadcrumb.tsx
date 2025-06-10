import { ChevronRight } from '@liam-hq/ui/src/icons'
import Link from 'next/link'
import type { FC } from 'react'
import styles from './SessionBreadcrumb.module.css'

type Props = {
  sessionName: string
}

export const SessionBreadcrumb: FC<Props> = ({ sessionName }) => {
  return (
    <div className={styles.breadcrumb}>
      <Link href="/app/design_sessions/new" className={styles.breadcrumbLink}>
        Sessions
      </Link>
      <ChevronRight className={styles.chevronRight} />
      <span className={styles.currentPage}>{sessionName}</span>
    </div>
  )
}
