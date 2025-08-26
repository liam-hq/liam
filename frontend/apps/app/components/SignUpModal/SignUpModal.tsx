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
} from '@liam-hq/ui'
import { type ChangeEvent, type FC, useCallback, useState } from 'react'
import styles from './SignUpModal.module.css'

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
    <ModalRoot open={isOpen} onOpenChange={onClose}>
      <ModalPortal>
        <ModalOverlay />
        <ModalContent className={styles.dialog}>
          <ModalTitle className="sr-only">Welcome to Liam DB</ModalTitle>
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
                <h1 className={styles.title}>Welcome to Liam DB</h1>
              </div>

              <div className={styles.oauthList}>
                <form onSubmit={handleEmailSignUp} className={styles.form}>
                  <div className={styles.formGroup}>
                    <label htmlFor="signup-email" className={styles.label}>
                      Email
                    </label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      size="md"
                      value={email}
                      onChange={handleChangeEmail}
                      required
                    />
                  </div>

                  <Button size="md" type="submit">
                    Sign up with email
                  </Button>
                </form>

                <div className={styles.divider}>
                  <span>OR</span>
                </div>

                <button
                  type="button"
                  onClick={handleGithubSignUp}
                  className={styles.oauthButton}
                >
                  <GithubLogo />
                  Sign up with GitHub
                </button>
              </div>

              <div className={styles.switchAuth}>
                Already have an account?{' '}
                <button
                  type="button"
                  className={styles.signInLink}
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
