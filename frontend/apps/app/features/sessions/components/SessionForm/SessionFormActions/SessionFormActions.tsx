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
  onFileSelect?: (files: FileList) => void
  onSubmit?: () => void
  onCancel?: () => void
  onArtifactModeChange?: (isActive: boolean) => void
  artifactMode?: boolean
}

export const SessionFormActions: FC<Props> = ({
  isPending = false,
  hasContent = false,
  onMicClick,
  onAttachClick,
  onFileSelect,
  onSubmit,
  onCancel,
  onArtifactModeChange,
  artifactMode = true,
}) => {
  const [isDeepModelingActive, setIsDeepModelingActive] = useState(artifactMode)

  const handleToggleChange = () => {
    const newValue = !isDeepModelingActive
    setIsDeepModelingActive(newValue)
    onArtifactModeChange?.(newValue)
  }

  return (
    <div className={styles.container}>
      <DeepModelingToggle
        isActive={isDeepModelingActive}
        onClick={handleToggleChange}
        disabled={isPending}
      >
        Deep Modeling
      </DeepModelingToggle>
      <MicButton onClick={onMicClick || (() => {})} disabled={isPending} />
      <AttachButton
        onClick={onAttachClick || (() => {})}
        onFileSelect={onFileSelect}
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
