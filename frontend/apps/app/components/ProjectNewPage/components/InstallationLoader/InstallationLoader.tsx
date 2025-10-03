'use client'

import { getInstallations, type Installation } from '@liam-hq/github'
import { useEffect, useState } from 'react'
import { createClient } from '../../../../libs/db/client'
import { SignInGithubButton } from '../../../LoginPage/SignInGithubButton'
import { InstallationSelector } from '../InstallationSelector'

type Props = {
  organizationId: string
}

export function InstallationLoader({ organizationId }: Props) {
  const [installations, setInstallations] = useState<Installation[] | null>(
    null,
  )
  const [needsGithubAuth, setNeedsGithubAuth] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()
      const session = data.session

      // If we don't have a provider token, prompt to sign in with GitHub
      if (!session?.provider_token) {
        setNeedsGithubAuth(true)
        setInstallations([])
        return
      }

      try {
        const { installations } = await getInstallations(session)
        setInstallations(installations)
      } catch (e) {
        console.error('Failed to load GitHub installations:', e)
        setInstallations([])
      }
    }
    void load()
  }, [])

  if (needsGithubAuth) {
    return (
      <div>
        <p>Connect your GitHub account to list installations.</p>
        <SignInGithubButton returnTo="/projects/new" />
      </div>
    )
  }

  if (installations === null) {
    return <div>Loading installations...</div>
  }

  return (
    <InstallationSelector
      installations={installations}
      organizationId={organizationId}
    />
  )
}
