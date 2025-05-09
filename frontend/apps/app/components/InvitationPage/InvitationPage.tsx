import type { FC } from 'react'
import { InvitationCard } from './components/InvitationCard'
import { getInvitationData } from './services/getInvitationData'

type Props = {
  token: string
}

export const InvitationPage: FC<Props> = async ({ token }) => {
  const { organizationName, currentUser } = await getInvitationData(token)

  return (
    <InvitationCard
      token={token}
      organizationName={organizationName}
      currentUser={currentUser}
    />
  )
}
