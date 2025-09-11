'use client'

import { type FC, useActionState } from 'react'
import { useSessionNavigation } from '../shared/hooks/useSessionNavigation'
import { createUploadSession } from './actions/createUploadSession'
import { UploadSessionFormPresenter } from './UploadSessionFormPresenter'

type Props = Record<string, never>

export const UploadSessionForm: FC<Props> = () => {
  const [state, formAction, isPending] = useActionState(createUploadSession, {
    success: false,
    error: '',
  })

  const { isRouting } = useSessionNavigation(state)

  return (
    <UploadSessionFormPresenter
      formError={!state.success ? state.error : undefined}
      isPending={isPending || isRouting}
      formAction={formAction}
      isTransitioning={false}
    />
  )
}
