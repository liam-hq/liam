import type { FC } from 'react'
import type { AuthModalType } from '@/hooks/useAuthModal'
import { SignInModal } from '../SignInModal'
import { SignUpModal } from '../SignUpModal'

type Props = {
  authModalType: AuthModalType
  onClose: () => void
  onSwitchToSignIn: () => void
  onSwitchToSignUp: () => void
  returnTo?: string
}

export const AuthModals: FC<Props> = ({
  authModalType,
  onClose,
  onSwitchToSignIn,
  onSwitchToSignUp,
  returnTo,
}) => {
  return (
    <>
      <SignInModal
        isOpen={authModalType === 'signin'}
        onClose={onClose}
        onSwitchToSignUp={onSwitchToSignUp}
        returnTo={returnTo}
      />
      <SignUpModal
        isOpen={authModalType === 'signup'}
        onClose={onClose}
        onSwitchToSignIn={onSwitchToSignIn}
      />
    </>
  )
}
