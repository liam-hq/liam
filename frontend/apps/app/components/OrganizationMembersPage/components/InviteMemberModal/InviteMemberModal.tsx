'use client'

import {
  Button,
  Input,
  ModalActions,
  ModalContent,
  ModalDescription,
  ModalOverlay,
  ModalPortal,
  ModalRoot,
  ModalTitle,
  useToast,
} from '@liam-hq/ui'
import {
  type ChangeEvent,
  type FC,
  type FormEvent,
  useRef,
  useState,
  useTransition,
} from 'react'
import { inviteMember } from './actions/inviteMember'
import styles from './InviteMemberModal.module.css'

type InviteMemberModalProps = {
  isOpen: boolean
  onClose: () => void
  organizationId: string
}

export const InviteMemberModal: FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  organizationId,
}) => {
  const [email, setEmail] = useState('')
  const [loading, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const toast = useToast()

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (error) setError(null)
    if (success) setSuccess(false)
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // Reset states
    setError(null)
    setSuccess(false)

    // Validate email
    if (!email.trim()) {
      setError('Email is required')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    startTransition(async () => {
      // Create FormData from the form
      const formData = new FormData()
      formData.append('email', email)
      formData.append('organizationId', organizationId)

      // Call the server action
      const result = await inviteMember(formData)

      if (!result.success) {
        setError(result.error || 'Failed to send invitation. Please try again.')

        // Show error toast
        toast({
          title: '❌ Invitation failed',
          description: `We couldn't send an invite to ${email}. Please try again.`,
          status: 'error',
        })

        return
      }

      // Success
      setSuccess(true)
      setEmail('')

      // Show success toast
      toast({
        title: '✅ Member invited successfully',
        description: `An invitation email has been sent to ${email}.`,
        status: 'success',
      })

      // Close modal
      onClose()
    })
  }

  return (
    <ModalRoot open={isOpen} onOpenChange={onClose}>
      <ModalPortal>
        <ModalOverlay />
        <ModalContent className={styles.modalContent}>
          <ModalTitle>Invite Members</ModalTitle>
          <ModalDescription>
            Invite new members by email address
          </ModalDescription>

          <form ref={formRef} onSubmit={handleSubmit}>
            <div className={styles.formContainer}>
              <div className={styles.inputContainer}>
                <Input
                  type="email"
                  name="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="Email address"
                  disabled={loading}
                  size="md"
                />
              </div>

              {error && <div className={styles.errorMessage}>{error}</div>}
              {success && (
                <div className={styles.successMessage}>
                  Invitation sent successfully!
                </div>
              )}
            </div>

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
                type="submit"
                isLoading={loading}
                disabled={!email.trim()}
                variant="solid-primary"
                size="md"
                loadingIndicatorType="content"
              >
                Invite
              </Button>
            </ModalActions>
          </form>
        </ModalContent>
      </ModalPortal>
    </ModalRoot>
  )
}
