import { Button, Callout, Input } from '@liam-hq/ui'
import {
  ModalActions,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalOverlay,
  ModalPortal,
  ModalRoot,
  ModalTitle,
} from '@liam-hq/ui/src/components/Modal/Modal'
import styles from './DeleteConfirmationModal.module.css'

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  organizationName: string
  confirmText: string
  onConfirmTextChange: (text: string) => void
  isConfirmEnabled: boolean
  onConfirm: () => void
  isPending?: boolean
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  organizationName,
  confirmText,
  onConfirmTextChange,
  isConfirmEnabled,
  onConfirm,
  isPending = false,
}: DeleteConfirmationModalProps) {
  return (
    <ModalRoot open={isOpen} onOpenChange={onClose}>
      <ModalPortal>
        <ModalOverlay />
        <ModalContent>
          <ModalTitle>Delete Organization</ModalTitle>
          <ModalDescription>
            This organization and all projects associated schema knowledge,
            review comments, and settings will be permanently deleted.
          </ModalDescription>

          <Callout variant="danger" device="mobile">
            This action is irreversible.
            <br />
            Please confirm before proceeding.
          </Callout>

          <div className={styles.divider} />
          <div className={styles.confirmInputContainer}>
            <p className={styles.confirmLabel}>
              Type{' '}
              <span className={styles.organizationName}>
                {organizationName}
              </span>{' '}
              to confirm.
            </p>
            <Input
              value={confirmText}
              onChange={(e) => onConfirmTextChange(e.target.value)}
              placeholder="Type the organization name here"
              className={styles.confirmInput}
              disabled={isPending}
            />
          </div>
          <div className={styles.divider} />

          <ModalActions>
            <ModalClose asChild>
              <Button variant="outline-secondary" disabled={isPending}>
                Cancel
              </Button>
            </ModalClose>
            <Button
              variant="solid-danger"
              disabled={!isConfirmEnabled || isPending}
              onClick={onConfirm}
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </ModalActions>
        </ModalContent>
      </ModalPortal>
    </ModalRoot>
  )
}
