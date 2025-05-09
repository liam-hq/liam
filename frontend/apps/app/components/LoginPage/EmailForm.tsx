'use client'

import { Button, Input } from '@/components'
import { type ChangeEvent, type FC, useCallback, useState } from 'react'
import styles from './LoginPage.module.css'
import { loginByEmail } from './services/loginByEmail'

type Props = {
  returnTo: string
}

export const EmailForm: FC<Props> = ({ returnTo }) => {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')

  const handleChangeEmail = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }, [])

  const handleChangePassword = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setPassword(e.target.value)
    },
    [],
  )

  return (
    <form className={styles.form}>
      <input type="hidden" name="returnTo" value={returnTo} />
      <div className={styles.formGroup}>
        <label htmlFor="email" className={styles.label}>
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Enter your email"
          size="md"
          value={email}
          onChange={handleChangeEmail}
        />
      </div>

      <div className={styles.formGroup}>
        <div className={styles.passwordHeader}>
          <label htmlFor="password" className={styles.label}>
            Password
          </label>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Enter your password"
          size="md"
          value={password}
          onChange={handleChangePassword}
        />
      </div>

      <Button size="md" type="submit" formAction={loginByEmail}>
        Sign in
      </Button>
    </form>
  )
}
