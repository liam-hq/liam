import { useRouter } from 'next/navigation'
import { useEffect, useTransition } from 'react'
import { usePreNavigationStream } from '../../../../../hooks/usePreNavigationStream'
import type { CreateSessionState } from '../validation/sessionFormValidation'

export const useSessionNavigation = (state: CreateSessionState) => {
  const router = useRouter()
  const [isRouting, startRouting] = useTransition()
  const { startStreamBeforeNavigation } = usePreNavigationStream()

  useEffect(() => {
    if (!state.success) return

    startStreamBeforeNavigation({
      userInput: state.initialMessage,
      designSessionId: state.designSessionId,
      userName: state.userName,
    })

    startRouting(() => {
      router.push(state.redirectTo)
    })
  }, [state, router, startStreamBeforeNavigation])

  return { isRouting }
}
