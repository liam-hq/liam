import { LiamLogoMark } from '@liam-hq/ui'
import { cookies } from 'next/headers'
import { EmailForm } from './EmailForm'
import styles from './LoginPage.module.css'
import { SignInGithubButton } from './SignInGithubButton'

export async function LoginPage() {
  // Get the returnTo value from the cookie
  let returnTo = '/app'

  const cookieStore = await cookies()
  const returnToCookie = cookieStore.get('returnTo')
  if (returnToCookie) {
    returnTo = returnToCookie.value
  }

  return (
    <div className={styles.container}>
      <div className={styles.cardContainer}>
        <div className={styles.card}>
          <div className={styles.titleWrapper}>
            <LiamLogoMark className={styles.logoMark} />
            <h1 className={styles.title}>Sign in to Liam Migration</h1>
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
