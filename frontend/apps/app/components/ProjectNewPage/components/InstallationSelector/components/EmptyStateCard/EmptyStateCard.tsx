import { Button, GithubLogo } from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './EmptyStateCard.module.css'
import { JackAndOctcat } from './JackAndOctcat'

type EmptyStateCardProps = {
  // TODO: Currently this only opens the installation page, but we should pass an OAuth re-authentication handler in the future.
  onActionClick: () => void
  actionDisabled: boolean
  description: string
  actionText: string
}

export const EmptyStateCard: FC<EmptyStateCardProps> = ({
  onActionClick,
  actionDisabled,
  description,
  actionText,
}) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <JackAndOctcat className={styles.emptyIllustration} />
        <p className={styles.emptyDescription}>{description}</p>
      </div>
      <Button
        variant="solid-primary"
        size="md"
        onClick={onActionClick}
        disabled={actionDisabled}
        leftIcon={<GithubLogo aria-hidden focusable="false" />}
      >
        {actionText}
      </Button>
    </div>
  )
}
