'use client'

import { Button, ToastProvider } from '@liam-hq/ui'
import { useRouter } from 'next/navigation'
import { type FC, useState } from 'react'
import { InvitationItem } from '../InvitationItem'
import { InviteMemberModal } from '../InviteMemberModal'
import { MemberItem } from '../MemberItem'
import { SearchInput } from '../SearchInput'
import styles from './ClientSearchWrapper.module.css'

interface Member {
  id: string
  joinedAt: string | null
  user: {
    id: string
    name: string
    email: string
  }
}

interface Invite {
  id: string
  email: string
  invitedAt: string | null
  inviteBy: {
    id: string
    name: string
    email: string
  }
}

interface ClientSearchWrapperProps {
  members: Member[]
  invites: Invite[]
  organizationId: string
  currentUserId: string
}

export const ClientSearchWrapper: FC<ClientSearchWrapperProps> = ({
  members = [],
  invites = [],
  organizationId,
  currentUserId,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [loading] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const router = useRouter()

  // Filter members based on search query
  const filteredMembers = members?.filter(
    (member) =>
      member.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user?.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Filter invites based on search query
  const filteredInvites = invites?.filter(
    (invite) =>
      invite.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invite.inviteBy?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleInvite = () => {
    setIsInviteModalOpen(true)
  }

  const handleRemoveSuccess = (isSelf: boolean) => {
    if (isSelf) {
      router.push('/app/organizations')
    } else {
      router.refresh()
    }
  }

  // Generate a deterministic avatar color based on user ID or email
  const getAvatarColor = (id: string | number) => {
    const stringId = id.toString()
    let hash = 0
    for (let i = 0; i < stringId.length; i++) {
      hash = stringId.charCodeAt(i) + ((hash << 5) - hash)
    }
    return (Math.abs(hash) % 7) + 1 // Return a number between 1 and 7
  }

  // Get initial from name
  const getInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : '?'
  }

  return (
    <ToastProvider>
      <div className={styles.container}>
        <InviteMemberModal
          isOpen={isInviteModalOpen}
          onClose={() => {
            setIsInviteModalOpen(false)
          }}
          organizationId={organizationId}
        />
        <div className={styles.header}>
          <SearchInput
            onSearch={handleSearch}
            loading={loading}
            placeholder="Search Members.."
          />
          <Button size="md" onClick={handleInvite}>
            Invite
          </Button>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Organization Members</h2>
          <div className={styles.membersList}>
            {filteredMembers && filteredMembers.length > 0 ? (
              filteredMembers.map((member) => (
                <MemberItem
                  key={member.id}
                  id={member.id}
                  name={member.user.name}
                  email={member.user.email}
                  initial={getInitial(member.user.name)}
                  avatarColor={getAvatarColor(member.user.id)}
                  organizationId={organizationId}
                  isSelf={member.user.id === currentUserId}
                  onRemoveSuccess={() =>
                    handleRemoveSuccess(member.user.id === currentUserId)
                  }
                />
              ))
            ) : (
              <p className={styles.emptyState}>No members found.</p>
            )}
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Pending Invitations</h2>
          <div className={styles.membersList}>
            {filteredInvites && filteredInvites.length > 0 ? (
              filteredInvites.map((invite) => (
                <InvitationItem
                  key={invite.id}
                  id={invite.id}
                  email={invite.email}
                  initial={invite.email.charAt(0).toUpperCase()}
                  avatarColor={getAvatarColor(invite.email)}
                  organizationId={organizationId}
                />
              ))
            ) : (
              <p className={styles.emptyState}>No pending invitations.</p>
            )}
          </div>
        </div>
      </div>
    </ToastProvider>
  )
}
