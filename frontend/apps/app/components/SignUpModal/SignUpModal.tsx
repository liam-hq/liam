'use client'

import {
  Button,
  GithubLogo,
  Input,
  LiamLogoMark,
  ModalContent,
  ModalOverlay,
  ModalPortal,
  ModalRoot,
  ModalTitle,
  XIcon,
} from '@liam-hq/ui'
import { type ChangeEvent, type FC, useCallback, useId, useState } from 'react'
import authStyles from '../AuthModal.module.css'

type Props = {
  isOpen: boolean
  onClose: () => void
  onSwitchToSignIn: () => void
}

export const SignUpModal: FC<Props> = ({
  isOpen,
  onClose,
  onSwitchToSignIn,
}) => {
  const [email, setEmail] = useState<string>('')
  const emailInputId = useId()

  const handleChangeEmail = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }, [])

  const handleGithubSignUp = () => {
    // TODO: Implement actual GitHub OAuth flow for sign up
  }

  const handleEmailSignUp = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement actual email sign up flow
    alert('Sign up feature is not yet implemented')
  }

  return (
    <ModalRoot
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
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
                  Welcome to Liam DB
                </ModalTitle>
              </div>

              <div className={authStyles.oauthList}>
                <form onSubmit={handleEmailSignUp} className={authStyles.form}>
                  <div className={authStyles.formGroup}>
                    <label htmlFor={emailInputId} className={authStyles.label}>
                      Email
                    </label>
                    <Input
                      id={emailInputId}
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      size="md"
                      value={email}
                      onChange={handleChangeEmail}
                      required
                      autoComplete="email"
                      inputMode="email"
                      autoCapitalize="none"
                      spellCheck={false}
                    />
                  </div>

                  <Button size="md" type="submit">
                    Sign up with email
                  </Button>
                </form>

                <div className={authStyles.divider}>
                  <span>OR</span>
                </div>

                <button
                  type="button"
                  onClick={handleGithubSignUp}
                  className={authStyles.oauthButton}
                >
                  <GithubLogo />
                  Sign up with GitHub
                </button>
              </div>

              <div className={authStyles.switchAuth}>
                Already have an account?{' '}
                <button
                  type="button"
                  className={authStyles.authSwitchLink}
                  onClick={onSwitchToSignIn}
                >
                  Sign in
                </button>
              </div>
            </div>
          </div>
        </ModalContent>
      </ModalPortal>
    </ModalRoot>
  )
}
