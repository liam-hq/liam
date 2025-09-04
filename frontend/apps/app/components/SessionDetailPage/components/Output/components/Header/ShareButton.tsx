'use client'

import { Button, Link } from '@liam-hq/ui'
import type { FC } from 'react'
import { useState } from 'react'
import { useAuthModal } from '../../../../../../hooks/useAuthModal'
import { AuthModals } from '../../../../../AuthModals'
import { ShareDialog } from '../../../../../ShareDialog'
import { useViewMode } from '../../../../hooks/viewMode/useViewMode'
import styles from './ShareButton.module.css'

type Props = {
  designSessionId: string
  initialIsPublic: boolean
}

export const ShareButton: FC<Props> = ({
  designSessionId,
  initialIsPublic = false,
}) => {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const { isPublic } = useViewMode()
  const {
    authModalType,
    openSignIn,
    closeModal,
    switchToSignIn,
    switchToSignUp,
    returnTo,
  } = useAuthModal()

  const handleShareClick = () => {
    if (isPublic) {
      openSignIn()
    } else {
      setIsShareDialogOpen(true)
    }
  }

  return (
    <>
      <Button
        variant="outline-secondary"
        size="md"
        leftIcon={<Link size={16} />}
        onClick={handleShareClick}
        className={styles.button}
      >
        Share
      </Button>

      <ShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        designSessionId={designSessionId}
        initialIsPublic={initialIsPublic}
      />

      <AuthModals
        authModalType={authModalType}
        onClose={closeModal}
        onSwitchToSignIn={switchToSignIn}
        onSwitchToSignUp={switchToSignUp}
        returnTo={returnTo}
      />
    </>
  )
}
