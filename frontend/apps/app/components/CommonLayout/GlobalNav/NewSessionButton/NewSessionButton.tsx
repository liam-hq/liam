'use client'

import { urlgen } from '@/libs/routes'
import { Plus } from '@liam-hq/ui/src/icons'
import clsx from 'clsx'
import Link from 'next/link'
import type { FC } from 'react'
import itemStyles from '../Item.module.css'
import styles from './NewSessionButton.module.css'

type Props = {
  isExpanded?: boolean
}

export const NewSessionButton: FC<Props> = ({ isExpanded = false }) => {
  return (
    <Link
      href={urlgen('design_sessions/new')}
      className={clsx(
        itemStyles.item,
        styles.newSessionButton,
        isExpanded && itemStyles.expandItem,
      )}
    >
      <div className={itemStyles.iconContainer}>
        <Plus className={styles.icon} />
      </div>
      <div
        className={clsx(
          itemStyles.labelArea,
          isExpanded && itemStyles.expandLabelArea,
        )}
      >
        <span className={itemStyles.label}>New Session</span>
      </div>
    </Link>
  )
}
