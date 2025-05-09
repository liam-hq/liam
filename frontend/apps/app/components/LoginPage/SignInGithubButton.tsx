'use client'

import { GithubLogo } from '@liam-hq/ui'
import styles from './LoginPage.module.css'
import { loginByGithub } from './services/loginByGithub'

type Props = {
  returnTo: string
}

export const SignInGithubButton = ({ returnTo }: Props) => {
  return (
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
  )
}
