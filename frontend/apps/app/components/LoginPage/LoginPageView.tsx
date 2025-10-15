import { LiamLogoMark } from '@liam-hq/ui'
import { EmailForm } from './EmailForm'
import styles from './LoginPage.module.css'
import { LogoutToast } from './LogoutToast'
import { SignInGithubButton } from './SignInGithubButton'

type Props = {
  returnTo?: string
  showLogoutToast?: boolean
}

export const LoginPageView = ({
  returnTo = '/design_sessions/new',
  showLogoutToast = false,
}: Props) => {
  return (
    <div className={styles.container}>
      {showLogoutToast && <LogoutToast />}
      <div className={styles.cardContainer}>
        <div className={styles.card}>
          <div className={styles.titleWrapper}>
            <LiamLogoMark className={styles.logoMark} />
            <h1 className={styles.title}>Sign in to Liam DB</h1>
          </div>

          <div className={styles.oauthList}>
            <EmailForm returnTo={returnTo} />
            <div className={styles.divider}>
              <span>OR</span>
            </div>
            <SignInGithubButton returnTo={returnTo} />
          </div>
        </div>
      </div>
    </div>
  )
}
