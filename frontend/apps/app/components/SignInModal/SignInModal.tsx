'use client'

import {
  GithubLogo,
  LiamLogoMark,
  ModalContent,
  ModalOverlay,
  ModalPortal,
  ModalRoot,
  ModalTitle,
} from '@liam-hq/ui'
import type { FC } from 'react'
import { EmailForm } from '../LoginPage/EmailForm'
import { loginByGithub } from '../LoginPage/services/loginByGithub'
import styles from './SignInModal.module.css'

type Props = {
  isOpen: boolean
  onClose: () => void
  onSwitchToSignUp: () => void
  returnTo?: string
}

export const SignInModal: FC<Props> = ({
  isOpen,
  onClose,
  onSwitchToSignUp,
  returnTo = '/app/design_sessions/new',
}) => {
  return (
    <ModalRoot open={isOpen} onOpenChange={onClose}>
      <ModalPortal>
        <ModalOverlay />
        <ModalContent className={styles.dialog}>
          <ModalTitle className="sr-only">Sign in to Liam DB</ModalTitle>
          <div className={styles.dialogContent}>
            <div className={styles.dialogHeader}>
              <button
                type="button"
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className={styles.authContent}>
              <div className={styles.titleWrapper}>
                <LiamLogoMark className={styles.logoMark} />
                <h1 className={styles.title}>Sign in to Liam DB</h1>
              </div>

              <div className={styles.oauthList}>
                <EmailForm returnTo={returnTo} />
                <div className={styles.divider}>
                  <span>OR</span>
                </div>
                <form>
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <button
                    type="submit"
                    formAction={loginByGithub}
                    className={styles.oauthButton}
                  >
                    <GithubLogo />
                    Sign in with GitHub
                  </button>
                </form>
              </div>

              <div className={styles.switchAuth}>
                No account?{' '}
                <button
                  type="button"
                  className={styles.createAccountLink}
                  onClick={onSwitchToSignUp}
                >
                  Create one
                </button>
              </div>
            </div>
          </div>
        </ModalContent>
      </ModalPortal>
    </ModalRoot>
  )
}
