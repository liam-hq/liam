'use client'

import { LiamLogoMark } from '@/logos'
import { Button } from '@liam-hq/ui'
import { useState } from 'react'
import styles from './InvitationCard.module.css'
import { acceptInvitation } from './actions/acceptInvitation'

interface InvitationCardProps {
  organizationName: string | null
  token: string
  currentUser: {
    id: string
    email: string | undefined
  }
}

export function InvitationCard({
  organizationName,
  token,
  currentUser,
}: InvitationCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAccept = async (formData: FormData) => {
    setIsLoading(true)
    setError(null)

    // The server action will handle the redirect on success
    const result = await acceptInvitation(formData)

    // If we get a result back, it means there was an error
    // (on success, the action redirects)
    if (result && !result.success) {
      setError(result.error || 'Failed to accept invitation. Please try again.')
    }

    setIsLoading(false)
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.content}>
          {organizationName && (
            <>
              <div>
                <LiamLogoMark width={40} height={40} />
              </div>

              <h1 className={styles.greeting}>Hi, {currentUser.email}!</h1>

              <div className={styles.description}>
                You've been invited to join{' '}
                <strong className={styles.organizationName}>
                  {organizationName}
                </strong>{' '}
                organization on Liam Migration.
                <br />
                Please accept the invitation below to join.
              </div>
            </>
          )}
        </div>

        <div className={styles.actions}>
          {organizationName && (
            <form action={handleAccept}>
              <input type="hidden" name="token" value={token} />

              <Button
                type="submit"
                className={styles.button}
                disabled={isLoading}
                isLoading={isLoading}
                loadingIndicatorType="content"
              >
                Accept Invite
              </Button>
            </form>
          )}

          {error && <p className={styles.error}>{error}</p>}
        </div>
      </div>
    </div>
  )
}
