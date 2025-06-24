'use client'

import type { FC } from 'react'
import { useState } from 'react'
import { ActionButton } from '../ActionButton'
import { AttachButton } from '../AttachButton'
import { DeepModelingToggle } from '../DeepModelingToggle'
import { MicButton } from '../MicButton'
import styles from './SessionFormActions.module.css'

type Props = {
  isPending?: boolean
  hasContent?: boolean
  onMicClick?: () => void
  onAttachClick?: () => void
  onSubmit?: () => void
  onCancel?: () => void
}

export const SessionFormActions: FC<Props> = ({
  isPending = false,
  hasContent = false,
  onMicClick,
  onAttachClick,
  onSubmit,
  onCancel,
}) => {
  const [isDeepModelingActive, setIsDeepModelingActive] = useState(false)

  return (
    <div className={styles.container}>
      <DeepModelingToggle
        isActive={isDeepModelingActive}
        onClick={() => setIsDeepModelingActive((prev) => !prev)}
        disabled={isPending}
      >
        Deep Modeling
      </DeepModelingToggle>
      <MicButton onClick={onMicClick || (() => {})} disabled={isPending} />
      <AttachButton
        onClick={onAttachClick || (() => {})}
        disabled={isPending}
      />
      <ActionButton
        hasContent={hasContent}
        isPending={isPending}
        onSubmit={onSubmit || (() => {})}
        onCancel={onCancel || (() => window.location.reload())}
      />
    </div>
  )
}

SessionFormActions.displayName = 'SessionFormActions'
