'use client'

import { type FC, useActionState } from 'react'
import { useSessionNavigation } from '../shared/hooks/useSessionNavigation'
import { createPasteSession } from './actions/createPasteSession'
import { PasteSessionFormPresenter } from './PasteSessionFormPresenter'

type Props = Record<string, never>

export const PasteSessionForm: FC<Props> = () => {
  const [state, formAction, isPending] = useActionState(createPasteSession, {
    success: false,
    error: '',
  })

  const { isRouting } = useSessionNavigation(state)

  return (
    <PasteSessionFormPresenter
      formError={!state.success ? state.error : undefined}
      isPending={isPending || isRouting}
      formAction={formAction}
      isTransitioning={false}
    />
  )
}
