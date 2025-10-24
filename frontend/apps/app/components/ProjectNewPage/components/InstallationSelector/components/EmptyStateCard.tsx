import { Button, GithubLogo } from '@liam-hq/ui'
import type { FC } from 'react'
import { JackAndOctcat } from '../../../../ProjectsPage/components/EmptyProjectsState/JackAndOctcat'
import styles from './EmptyStateCard.module.css'

type EmptyStateVariant = 'connect' | 'reauth'

type EmptyStateCardProps = {
  variant: EmptyStateVariant
  // TODO: Currently this only opens the installation page, but we should pass an OAuth re-authentication handler in the future.
  onActionClick: () => void
  actionDisabled: boolean
}

export const EmptyStateCard: FC<EmptyStateCardProps> = ({
  variant,
  onActionClick,
  actionDisabled,
}) => {
  const description =
    variant === 'reauth'
      ? 'Your GitHub account requires re-authentication to see your repositories.'
      : 'Add a GitHub installation to see your repositories.'
  const actionText =
    variant === 'reauth' ? 'Continue with GitHub' : 'Add Installation'

  return (
    <div className={styles.emptyState}>
      <JackAndOctcat className={styles.emptyIllustration} />
      <p className={styles.emptyDescription}>{description}</p>
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
