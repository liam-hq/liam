'use client'

import {
  Button,
  ModalActions,
  ModalContent,
  ModalDescription,
  ModalOverlay,
  ModalPortal,
  ModalRoot,
  ModalTitle,
  useToast,
} from '@liam-hq/ui'
import { type FC, useTransition } from 'react'
import { removeMember } from './actions/removeMember'

type DeleteMemberModalProps = {
  isOpen: boolean
  onClose: () => void
  memberId: string
  organizationId: string
  memberName: string
  isSelf: boolean
  // eslint-disable-next-line no-restricted-syntax
  onSuccess?: () => void
}

export const DeleteMemberModal: FC<DeleteMemberModalProps> = ({
  isOpen,
  onClose,
  memberId,
  organizationId,
  memberName,
  isSelf,
  onSuccess,
}) => {
  const [loading, startTransition] = useTransition()
  const toast = useToast()

  const handleDelete = async () => {
    startTransition(async () => {
      // Create FormData
      const formData = new FormData()
      formData.append('memberId', memberId)
      formData.append('organizationId', organizationId)

      // Call the server action
      const result = await removeMember(formData)

      if (!result.success) {
        toast({
          title: '❌ Deletion failed',
          description:
            result.error || 'Failed to remove member. Please try again.',
          status: 'error',
        })
        return
      }

      // Success
      toast({
        title: '✅ Member removed',
        description: isSelf
          ? 'You have left the organization.'
          : `${memberName} has been removed from the organization.`,
        status: 'success',
      })

      // Close modal and trigger success callback
      onClose()
      if (onSuccess) onSuccess()
    })
  }

  return (
    <ModalRoot open={isOpen} onOpenChange={onClose}>
      <ModalPortal>
        <ModalOverlay />
        <ModalContent>
          <ModalTitle>Delete Member</ModalTitle>
          <ModalDescription>
            You are about to remove this member. Are you sure?
          </ModalDescription>

          <ModalActions>
            <Button
              type="button"
              onClick={onClose}
              disabled={loading}
              variant="outline-secondary"
              size="md"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              isLoading={loading}
              variant="solid-danger"
              size="md"
              loadingIndicatorType="content"
            >
              Delete
            </Button>
          </ModalActions>
        </ModalContent>
      </ModalPortal>
    </ModalRoot>
  )
}
