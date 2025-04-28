'use client'

import { Button, Input } from '@liam-hq/ui'
import { GithubLogo, LiamLogoMark } from '@liam-hq/ui'
import Link from 'next/link'
import { GoogleLogo } from './GoogleLogo'
import styles from './styles.module.css'

export const RegisterPage = () => {
  // 機能実装はスキップ
  const handleEmailSignUp = () => {
    // 実装スキップ
  }

  const handleGitHubSignUp = () => {
    // 実装スキップ
  }

  const handleGoogleSignUp = () => {
    // 実装スキップ
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* ロゴとタイトル */}
        <div className={styles.logoContainer}>
          <LiamLogoMark className={styles.logo} />
        </div>
        <h1 className={styles.title}>Sign up to Liam Migration</h1>

        {/* フォーム */}
        <div className={styles.formContainer}>
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              name="email"
              aria-label="Email address"
            />
          </div>
          <Button onClick={handleEmailSignUp} variant="solid-primary" size="sm">
            Sign up for free
          </Button>
        </div>

        {/* 区切り */}
        <div className={styles.divider}>
          <div className={styles.line} />
          <span className={styles.orText}>OR</span>
          <div className={styles.line} />
        </div>

        {/* ソーシャルボタン */}
        <div className={styles.socialButtons}>
          <button
            type="button"
            onClick={handleGitHubSignUp}
            className={styles.socialButton}
            aria-label="Sign up with GitHub"
          >
            <span className={styles.socialIcon}>
              <GithubLogo />
            </span>
            Sign up with GitHub
          </button>
          <button
            type="button"
            onClick={handleGoogleSignUp}
            className={styles.socialButton}
            aria-label="Sign up with Google"
          >
            <span className={styles.socialIcon}>
              <GoogleLogo />
            </span>
            Sign up with Google
          </button>
        </div>

        {/* アカウント案内 */}
        <div className={styles.accountPrompt}>
          <span className={styles.accountText}>
            Already have a Liam Schema account?
          </span>
          <Link href="/app/login" className={styles.signInLink}>
            Sign in
          </Link>
        </div>

        {/* 利用規約 */}
        <p className={styles.termsText}>
          By creating an account, you agree to our
          <br />
          <Link href="/terms" className={styles.termsLink}>
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className={styles.termsLink}>
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
}
