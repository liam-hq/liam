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
import { DeleteMemberModal } from '../DeleteMemberModal'
import styles from './MemberItem.module.css'

interface MemberItemProps {
  id: string
  name: string
  email: string
  initial: string
  avatarColor?: number
  organizationId: string
  isSelf: boolean
  onRemoveSuccess?: () => void
}

export const MemberItem: FC<MemberItemProps> = ({
  id,
  name,
  email,
  initial,
  avatarColor = 1,
  organizationId,
  isSelf,
  onRemoveSuccess,
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true)
  }

  return (
    <div className={styles.memberItem}>
      <DeleteMemberModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        memberId={id}
        organizationId={organizationId}
        memberName={name}
        isSelf={isSelf}
        onSuccess={onRemoveSuccess}
      />

      <Avatar
        initial={initial}
        size="lg"
        user={getAvatarUserFromColor(avatarColor)}
      />
      <div className={styles.memberBody}>
        <div className={styles.memberInfo}>
          <div className={styles.nameEmail}>
            <span className={styles.name}>{name}</span>
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
                    {isSelf ? 'Leave Organization' : 'Remove From Organization'}
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
