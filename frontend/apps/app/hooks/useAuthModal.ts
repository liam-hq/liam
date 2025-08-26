import { useCallback, useState } from 'react'

export type AuthModalType = 'signin' | 'signup' | null

export const useAuthModal = () => {
  const [authModalType, setAuthModalType] = useState<AuthModalType>(null)

  const openSignIn = useCallback(() => setAuthModalType('signin'), [])
  const openSignUp = useCallback(() => setAuthModalType('signup'), [])
  const closeModal = useCallback(() => setAuthModalType(null), [])
  const switchToSignIn = useCallback(() => setAuthModalType('signin'), [])
  const switchToSignUp = useCallback(() => setAuthModalType('signup'), [])

  const returnTo =
    typeof window !== 'undefined'
      ? window.location.pathname.replace('/app/public/', '/app/')
      : '/app/design_sessions/new'

  return {
    authModalType,
    openSignIn,
    openSignUp,
    closeModal,
    switchToSignIn,
    switchToSignUp,
    returnTo,
  }
}
