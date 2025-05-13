import { Button } from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './RepositoryItem.module.css'

type Props = {
  name: string
  onClick: () => void
  isLoading?: boolean
}

export const RepositoryItem: FC<Props> = ({
  name,
  onClick,
  isLoading = false,
}) => {
  return (
    <div className={styles.wrapper}>
      <span>{name}</span>
      <Button
        size="sm"
        variant="solid-primary"
        onClick={onClick}
        disabled={isLoading}
      >
        {isLoading ? 'Importing...' : 'Import'}
      </Button>
    </div>
  )
}
