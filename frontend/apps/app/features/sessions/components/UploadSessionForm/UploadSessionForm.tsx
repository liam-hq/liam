'use client'

import { HumanMessage } from '@langchain/core/messages'
import { useRouter } from 'next/navigation'
import { type FC, useActionState, useEffect, useTransition } from 'react'
import { LG_INITIAL_MESSAGE_PREFIX } from '../../../../constants/storageKeys'
import { createUploadSession } from './actions/createUploadSession'
import { UploadSessionFormPresenter } from './UploadSessionFormPresenter'

type Props = Record<string, never>

export const UploadSessionForm: FC<Props> = () => {
  const router = useRouter()
  const [isRouting, startRouting] = useTransition()
  const [state, formAction, isPending] = useActionState(createUploadSession, {
    success: false,
    error: '',
  })

  useEffect(() => {
    if (!state.success) return

    startRouting(() => {
      // Store the initial message for optimistic rendering
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

  return (
    <UploadSessionFormPresenter
      formError={!state.success ? state.error : undefined}
      isPending={isPending || isRouting}
      formAction={formAction}
      isTransitioning={false}
    />
  )
}
