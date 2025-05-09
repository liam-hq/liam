'use client'

import {
  Avatar,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
  Ellipsis,
  IconButton,
  getAvatarUserFromColor,
} from '@liam-hq/ui'
import { useState } from 'react'
import type { FC } from 'react'
import { DeleteInvitationModal } from '../DeleteInvitationModal'
import styles from './InvitationItem.module.css'

interface InvitationItemProps {
  id: string
  email: string
  initial: string
  avatarColor: number
  organizationId: string
}

export const InvitationItem: FC<InvitationItemProps> = ({
  id,
  email,
  initial,
  avatarColor,
  organizationId,
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true)
  }

  return (
    <div className={styles.memberItem}>
      <DeleteInvitationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        invitationId={id}
        organizationId={organizationId}
        email={email}
      />

      <Avatar
        initial={initial}
        size="lg"
        user={getAvatarUserFromColor(avatarColor)}
      />
      <div className={styles.memberBody}>
        <div className={styles.memberInfo}>
          <div className={styles.nameEmail}>
            <span className={styles.name}>{email.split('@')[0]}</span>
            <span className={styles.email}>{email}</span>
          </div>
          <div className={styles.spacer} />
          <div className={styles.moreButton}>
            <DropdownMenuRoot>
              <DropdownMenuTrigger asChild>
                <IconButton
                  icon={<Ellipsis />}
                  tooltipContent="More options"
                  size="sm"
                />
              </DropdownMenuTrigger>
              <DropdownMenuPortal>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    variant="danger"
                    onClick={handleDeleteClick}
                  >
                    Cancel Invitation
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenuRoot>
          </div>
        </div>
      </div>
    </div>
  )
}
