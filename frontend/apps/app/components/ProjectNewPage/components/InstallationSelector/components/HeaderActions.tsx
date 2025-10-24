import type { Installation } from '@liam-hq/github'
import { Button, GithubLogo, Plus } from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './HeaderActions.module.css'
import { InstallationDropdown } from './InstallationDropdown'

type HeaderActionsProps = {
  hasInstallations: boolean
  needsRefresh: boolean
  installations: Installation[]
  selectedInstallationLabel: string
  onSelectInstallation: (installation: Installation) => void
  onInstallApp: () => void
  onConnectGitHub: () => void
  hasGithubAppUrl: boolean
}

export const HeaderActions: FC<HeaderActionsProps> = ({
  hasInstallations,
  needsRefresh,
  installations,
  selectedInstallationLabel,
  onSelectInstallation,
  onInstallApp,
  onConnectGitHub,
  hasGithubAppUrl,
}) => {
  const actionText = needsRefresh ? 'Continue with GitHub' : 'Add Installation'
  if (!hasInstallations || needsRefresh) {
    return (
      <div className={styles.actions}>
        <Button
          size="md"
          variant="solid-primary"
          onClick={onConnectGitHub}
          disabled={!hasGithubAppUrl}
          className={styles.connectButton}
          leftIcon={
            <GithubLogo
              className={styles.githubIcon}
              aria-hidden
              focusable="false"
            />
          }
        >
          {actionText}
        </Button>
      </div>
    )
  }

  return (
    <div className={styles.actions}>
      <InstallationDropdown
        installations={installations}
        disabled={needsRefresh}
        selectedLabel={selectedInstallationLabel}
        onSelect={onSelectInstallation}
      />
      <Button
        size="md"
        variant="outline-secondary"
        onClick={onInstallApp}
        disabled={!hasGithubAppUrl}
        className={styles.installButton}
        leftIcon={<Plus aria-hidden focusable="false" />}
      >
        Install GitHub App
      </Button>
    </div>
  )
}
