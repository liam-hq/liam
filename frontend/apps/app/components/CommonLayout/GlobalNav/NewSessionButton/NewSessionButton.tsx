import clsx from 'clsx'
import { MessageCircleIcon } from 'lucide-react'
import Link from 'next/link'
import type { FC } from 'react'
import { urlgen } from '@/libs/routes'
import itemStyles from '../Item.module.css'
import styles from './NewSessionButton.module.css'

export const NewSessionButton: FC = () => {
  return (
    <Link
      href={urlgen('design_sessions/new')}
      className={clsx(itemStyles.item, styles.newSessionButton)}
    >
      <div className={itemStyles.iconContainer}>
        <MessageCircleIcon className={styles.icon} />
      </div>
      <div className={itemStyles.labelArea}>
        <span className={itemStyles.label}>New Session</span>
      </div>
    </Link>
  )
}
