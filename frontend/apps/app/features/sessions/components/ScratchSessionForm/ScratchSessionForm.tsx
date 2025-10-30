'use client'

import { type FC, useActionState } from 'react'
import { useSessionNavigation } from '../shared/hooks/useSessionNavigation'
import { createScratchSession } from './actions/createScratchSession'
import { ScratchSessionFormPresenter } from './ScratchSessionFormPresenter'

type Props = Record<string, never>

export const ScratchSessionForm: FC<Props> = () => {
  const [state, formAction, isPending] = useActionState(createScratchSession, {
    success: false,
    error: '',
  })

  const { isRouting } = useSessionNavigation(state)

  return (
    <ScratchSessionFormPresenter
      formError={!state.success ? state.error : undefined}
      isPending={isPending || isRouting}
      formAction={formAction}
    />
  )
}
