'use client'

import {
  GithubLogo,
  LiamLogoMark,
  ModalContent,
  ModalOverlay,
  ModalPortal,
  ModalRoot,
  ModalTitle,
  XIcon,
} from '@liam-hq/ui'
import type { FC } from 'react'
import authStyles from '../AuthModal.module.css'
import { EmailForm } from '../LoginPage/EmailForm'
import { loginByGithub } from '../LoginPage/services/loginByGithub'

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
    <ModalRoot open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalPortal>
        <ModalOverlay />
        <ModalContent className={authStyles.dialog}>
          <div className={authStyles.dialogContent}>
            <div className={authStyles.dialogHeader}>
              <button
                type="button"
                className={authStyles.closeButton}
                onClick={onClose}
                aria-label="Close"
              >
                <XIcon size={18} />
              </button>
            </div>

            <div className={authStyles.authContent}>
              <div className={authStyles.titleWrapper}>
                <LiamLogoMark className={authStyles.logoMark} />
                <ModalTitle className={authStyles.title}>
                  Sign in to Liam DB
                </ModalTitle>
              </div>

              <div className={authStyles.oauthList}>
                <EmailForm returnTo={returnTo} />
                <div className={authStyles.divider}>
                  <span>OR</span>
                </div>
                <form>
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <button
                    type="submit"
                    formAction={loginByGithub}
                    className={authStyles.oauthButton}
                  >
                    <GithubLogo />
                    Sign in with GitHub
                  </button>
                </form>
              </div>

              <div className={authStyles.switchAuth}>
                No account?{' '}
                <button
                  type="button"
                  className={authStyles.authSwitchLink}
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
