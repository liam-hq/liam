import { InfoIcon } from '@liam-hq/ui'
import clsx from 'clsx'
import Link from 'next/link'
import type { FC } from 'react'
import { urlgen } from '../../../../../../libs/routes'
import styles from './SchemaSetupNotice.module.css'

type Props = {
  projectId: string
}

export const SchemaSetupNotice: FC<Props> = ({ projectId }) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.head}>
        <InfoIcon className={styles.icon} />
        <p className={styles.text}>Schema file not found.</p>
      </div>

      <Link
        href={urlgen('projects/[projectId]', {
          projectId,
        })}
        className={clsx(styles.text, styles.link)}
      >
        Set it up in Project Settings →
      </Link>
    </div>
  )
}
