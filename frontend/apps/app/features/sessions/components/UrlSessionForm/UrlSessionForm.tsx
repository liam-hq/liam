'use client'

import { type FC, useActionState } from 'react'
import { useSessionNavigation } from '../shared/hooks/useSessionNavigation'
import { createUrlSession } from './actions/createUrlSession'
import { URLSessionFormPresenter } from './URLSessionFormPresenter'

type Props = Record<string, never>

export const UrlSessionForm: FC<Props> = () => {
  const [state, formAction, isPending] = useActionState(createUrlSession, {
    success: false,
    error: '',
  })

  const { isRouting } = useSessionNavigation(state)

  return (
    <URLSessionFormPresenter
      formError={!state.success ? state.error : undefined}
      isPending={isPending || isRouting}
      formAction={formAction}
      isTransitioning={false}
    />
  )
}
