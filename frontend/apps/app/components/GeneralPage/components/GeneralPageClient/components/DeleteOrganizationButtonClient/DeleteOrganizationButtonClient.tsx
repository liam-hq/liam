'use client'

import { Button } from '@liam-hq/ui'
import { useState, useTransition } from 'react'
import { DeleteConfirmationModal } from './DeleteConfirmationModal'

interface DeleteOrganizationButtonClientProps {
  organizationId: string
  organizationName: string
  deleteAction: (formData: FormData) => void
}

export function DeleteOrganizationButtonClient({
  organizationId,
  organizationName,
  deleteAction,
}: DeleteOrganizationButtonClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleOpenModal = () => {
    setIsModalOpen(true)
    // Reset confirmation text when opening the modal
    setConfirmText('')
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleConfirmTextChange = (text: string) => {
    setConfirmText(text)
  }

  const handleConfirmDelete = () => {
    // Check if confirmation text matches organization name
    if (confirmText === organizationName) {
      // Create FormData object
      const formData = new FormData()
      formData.append('organizationId', organizationId)
      formData.append('confirmText', confirmText)

      // Use startTransition to wrap the action call
      startTransition(() => {
        deleteAction(formData)
      })

      // Close the modal
      handleCloseModal()
    }
  }

  return (
    <>
      <Button
        variant="solid-danger"
        onClick={handleOpenModal}
        disabled={isPending}
      >
        {isPending ? 'Deleting...' : 'Delete'}
      </Button>

      <DeleteConfirmationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        organizationName={organizationName}
        confirmText={confirmText}
        onConfirmTextChange={handleConfirmTextChange}
        isConfirmEnabled={confirmText === organizationName}
        onConfirm={handleConfirmDelete}
        isPending={isPending}
      />
    </>
  )
}
