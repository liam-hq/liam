import type { Installation } from '@liam-hq/github'
import { ArrowLeft } from '@liam-hq/ui'
import clsx from 'clsx'
import Link from 'next/link'
import type { FC } from 'react'
import { urlgen } from '../../libs/routes'
import { TokenRefreshKick } from '../TokenRefreshKick'
import { InstallationSelector } from './components/InstallationSelector'
import styles from './ProjectNewPage.module.css'

type Props = {
  installations: Installation[]
  organizationId: string
  needsRefresh?: boolean
}

export const ProjectNewPage: FC<Props> = ({
  installations,
  organizationId,
  needsRefresh,
}) => {
  return (
    <div className={styles.container}>
      <TokenRefreshKick trigger={needsRefresh} />
      <div className={styles.content}>
        <header className={styles.header}>
          <h1 className={styles.title}>Add New Project</h1>
          <div className={styles.steps}>
            <div className={clsx(styles.step, styles.stepActive)}>
              <span className={clsx(styles.stepBadge, styles.stepBadgeActive)}>
                1
              </span>
              <span className={clsx(styles.stepLabel, styles.stepLabelActive)}>
                Import Git Repository
              </span>
            </div>
            <span className={styles.stepDivider} aria-hidden="true" />
            <div className={styles.step}>
              <span className={styles.stepBadge}>2</span>
              <span className={styles.stepLabel}>Set Watch Schemas</span>
            </div>
            <span className={styles.stepSpacer} />
          </div>
        </header>
        <InstallationSelector
          installations={installations}
          organizationId={organizationId}
          needsRefresh={needsRefresh}
        />
        <Link href={urlgen('projects')} className={styles.backLink}>
          <ArrowLeft aria-hidden className={styles.backIcon} />
          <span>Back to Projects</span>
        </Link>
      </div>
    </div>
  )
}
