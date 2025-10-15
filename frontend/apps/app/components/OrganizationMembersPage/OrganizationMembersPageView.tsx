import { ClientSearchWrapper } from './components/ClientSearchWrapper'

type Member = {
  id: string
  joinedAt: string | null
  user: {
    id: string
    name: string
    email: string
    avatar_url?: string | null
  }
}

type Invite = {
  id: string
  email: string
  invitedAt: string | null
  inviteBy: {
    id: string
    name: string
    email: string
  }
}

type Props = {
  members: Member[]
  invites: Invite[]
  organizationId: string
  currentUserId: string
}

export const OrganizationMembersPageView = ({
  members,
  invites,
  organizationId,
  currentUserId,
}: Props) => {
  return (
    <ClientSearchWrapper
      members={members}
      invites={invites}
      organizationId={organizationId}
      currentUserId={currentUserId}
    />
  )
}
