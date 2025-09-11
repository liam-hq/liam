import { HumanMessage } from '@langchain/core/messages'
import { useRouter } from 'next/navigation'
import { useEffect, useTransition } from 'react'
import { LG_INITIAL_MESSAGE_PREFIX } from '../../../../../constants/storageKeys'
import type { CreateSessionState } from '../validation/sessionFormValidation'

export const useSessionNavigation = (state: CreateSessionState) => {
  const router = useRouter()
  const [isRouting, startRouting] = useTransition()

  useEffect(() => {
    if (!state.success) return

    startRouting(() => {
      const humanMessage = new HumanMessage({
        id: crypto.randomUUID(),
        content: state.initialMessage,
        additional_kwargs: {
          userName: state.userName,
        },
      })
      sessionStorage.setItem(
        `${LG_INITIAL_MESSAGE_PREFIX}:${state.designSessionId}`,
        JSON.stringify(humanMessage),
      )

      router.push(state.redirectTo)
    })
  }, [state, router])

  return { isRouting }
}
