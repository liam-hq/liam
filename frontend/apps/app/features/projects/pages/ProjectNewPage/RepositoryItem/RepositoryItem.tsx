import { Button } from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './RepositoryItem.module.css'

type Props = {
  name: string
  isLoading?: boolean
}

export const RepositoryItem: FC<Props> = ({ name, isLoading = false }) => {
  return (
    <div className={styles.wrapper}>
      <span>{name}</span>
      <Button
        size="sm"
        variant="solid-primary"
        disabled={isLoading}
        type="submit"
      >
        {isLoading ? 'Importing...' : 'Import'}
      </Button>
    </div>
  )
}
