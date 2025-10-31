import type { Repository } from '@liam-hq/github'
import { BookMarked, Button, Lock } from '@liam-hq/ui'
import type { FC } from 'react'
import { formatDateShort } from '../../../../../../../libs/utils'
import styles from './RepositoryItem.module.css'

type Props = {
  item: Repository
  isLoading?: boolean
  onClick: () => void
}

export const RepositoryItem: FC<Props> = ({
  item,
  isLoading = false,
  onClick,
}) => {
  const { name, private: isPrivate, created_at } = item

  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <BookMarked className={styles.bookMarkIcon} />
        <div className={styles.info}>
          <span className={styles.name}>{name}</span>
          {isPrivate && <Lock className={styles.lockIcon} />}
          {created_at && (
            <span className={styles.createdAt}>
              {formatDateShort(created_at)}
            </span>
          )}
        </div>
      </div>
      <Button
        size="sm"
        variant="solid-primary"
        disabled={isLoading}
        onClick={onClick}
      >
        {isLoading ? 'Importing...' : 'Import'}
      </Button>
    </div>
  )
}
