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
import { useState } from 'react'
import type { FC } from 'react'
import { removeInvitation } from './actions/removeInvitation'

interface DeleteInvitationModalProps {
  isOpen: boolean
  onClose: () => void
  invitationId: string
  organizationId: string
  email: string
}

export const DeleteInvitationModal: FC<DeleteInvitationModalProps> = ({
  isOpen,
  onClose,
  invitationId,
  organizationId,
  email,
}) => {
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const handleDelete = async () => {
    setLoading(true)

    // Create FormData
    const formData = new FormData()
    formData.append('invitationId', invitationId)
    formData.append('organizationId', organizationId)

    // Call the server action
    const result = await removeInvitation(formData)

    if (!result.success) {
      toast({
        title: '❌ Cancellation failed',
        description:
          result.error || 'Failed to cancel invitation. Please try again.',
        status: 'error',
      })
      setLoading(false)
      return
    }

    // Success
    toast({
      title: '✅ Invitation canceled',
      description: `The invitation to ${email} has been canceled.`,
      status: 'success',
    })

    // Close modal
    onClose()
    setLoading(false)
  }

  return (
    <ModalRoot open={isOpen} onOpenChange={onClose}>
      <ModalPortal>
        <ModalOverlay />
        <ModalContent>
          <ModalTitle>Cancel Invitation</ModalTitle>
          <ModalDescription>
            Are you sure you want to cancel this invitation?
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
              Submit
            </Button>
          </ModalActions>
        </ModalContent>
      </ModalPortal>
    </ModalRoot>
  )
}
