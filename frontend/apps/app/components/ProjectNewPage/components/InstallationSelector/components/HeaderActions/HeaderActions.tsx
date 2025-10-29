import { Button, Plus } from '@liam-hq/ui'
import type { FC, ReactNode } from 'react'
import styles from './HeaderActions.module.css'

type HeaderActionsProps = {
  installationDropdown: ReactNode
  onInstallApp: () => void
  installButtonDisabled: boolean
}

export const HeaderActions: FC<HeaderActionsProps> = ({
  installationDropdown,
  onInstallApp,
  installButtonDisabled,
}) => {
  return (
    <div className={styles.actions}>
      {installationDropdown}
      <Button
        size="md"
        variant="outline-secondary"
        onClick={onInstallApp}
        disabled={installButtonDisabled}
        className={styles.installButton}
        leftIcon={<Plus aria-hidden focusable="false" />}
      >
        Configure Repositories on GitHub
      </Button>
    </div>
  )
}
