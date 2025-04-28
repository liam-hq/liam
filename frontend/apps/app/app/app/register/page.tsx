'use client'

import { Button, Input } from '@liam-hq/ui'
import { LiamLogoMark } from '@liam-hq/ui'
import Link from 'next/link'
import styles from './register.module.css'

export default function RegisterPage() {
  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <div className={styles.header}>
          <LiamLogoMark width={40} height={40} />
          <h2 className={styles.title}>Sign up to Liam Migration</h2>
        </div>

        <div className={styles.formSection}>
          <label htmlFor="email" className={styles.label}>
            Email
          </label>
          <Input
            id="email"
            placeholder="Enter your email"
            className={styles.input}
            wrapperClassName={styles.inputWrapper}
          />
          <Button
            variant="solid-primary"
            size="md"
            className={styles.signupButton}
          >
            Sign up for free
          </Button>
        </div>

        <div className={styles.divider}>
          <div className={styles.line} />
          <span className={styles.orText}>OR</span>
          <div className={styles.line} />
        </div>

        <div className={styles.socialLoginSection}>
          <Button
            variant="outline-secondary"
            size="md"
            className={styles.socialButton}
            leftIcon={<GitHubIcon />}
          >
            Sign up with GitHub
          </Button>
          <Button
            variant="outline-secondary"
            size="md"
            className={styles.socialButton}
            leftIcon={<GoogleIcon />}
          >
            Sign up with Google
          </Button>

          <div className={styles.loginLink}>
            <span className={styles.loginText}>
              Already have a Liam Schema account?
            </span>
            <Link href="/app/login" className={styles.loginButton}>
              Sign in
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.termsContainer}>
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

function GitHubIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="GitHub Logo"
    >
      <title>GitHub Logo</title>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.53 5.47 15.59C5.87 15.66 6.02 15.42 6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.72C4 14.09 3.48 13.23 3.32 12.78C3.23 12.55 2.84 11.84 2.5 11.65C2.22 11.5 1.82 11.13 2.49 11.12C3.12 11.11 3.57 11.7 3.72 11.94C4.44 13.15 5.59 12.81 6.05 12.6C6.12 12.08 6.33 11.73 6.56 11.53C4.78 11.33 2.92 10.64 2.92 7.58C2.92 6.71 3.23 5.99 3.74 5.43C3.66 5.23 3.38 4.41 3.82 3.31C3.82 3.31 4.49 3.1 6.02 4.13C6.66 3.95 7.34 3.86 8.02 3.86C8.7 3.86 9.38 3.95 10.02 4.13C11.55 3.09 12.22 3.31 12.22 3.31C12.66 4.41 12.38 5.23 12.3 5.43C12.81 5.99 13.12 6.7 13.12 7.58C13.12 10.65 11.25 11.33 9.47 11.53C9.76 11.78 10.01 12.26 10.01 13.01C10.01 14.08 10 14.94 10 15.21C10 15.42 10.15 15.67 10.55 15.59C13.71 14.53 16 11.53 16 8C16 3.58 12.42 0 8 0Z"
        fill="currentColor"
      />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Google Logo"
    >
      <title>Google Logo</title>
      <path
        d="M15.8451 8.17052C15.8451 7.64409 15.7965 7.13599 15.7076 6.63965H8.16113V9.63869H12.4992C12.3295 10.6108 11.7628 11.4476 10.9577 12.0008V13.9826H13.5589C15.0608 12.5935 15.8451 10.5575 15.8451 8.17052Z"
        fill="#4285F4"
      />
      <path
        d="M8.16109 15.9999C10.3268 15.9999 12.1398 15.2794 13.5588 13.9826L10.9576 12.0008C10.2543 12.4717 9.31012 12.7426 8.16109 12.7426C6.0772 12.7426 4.30947 11.3373 3.67202 9.43933H0.980469V11.488C2.42202 14.2117 5.12629 15.9999 8.16109 15.9999Z"
        fill="#34A853"
      />
      <path
        d="M3.67206 9.43933C3.33629 8.46724 3.33629 7.4127 3.67206 6.44061V4.3919H0.980513C-0.0321143 6.59643 -0.0321143 9.28351 0.980513 11.488L3.67206 9.43933Z"
        fill="#FBBC04"
      />
      <path
        d="M8.16109 3.25734C9.31661 3.24033 10.4314 3.6867 11.2527 4.50052L13.5669 2.18639C12.0896 0.800519 10.163 0.0108721 8.16109 0.0278437C5.12629 0.0278437 2.42202 1.81606 0.980469 4.53976L3.67202 6.58846C4.30947 4.69052 6.0772 3.25734 8.16109 3.25734Z"
        fill="#EA4335"
      />
    </svg>
  )
}
