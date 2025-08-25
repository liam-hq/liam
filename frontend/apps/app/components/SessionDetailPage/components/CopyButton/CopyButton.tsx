'use client'

import { Check, Copy, IconButton } from '@liam-hq/ui'
import { useCopy } from '@liam-hq/ui/hooks'
import type { FC } from 'react'

type Props = {
  textToCopy: string
  tooltipLabel: string
  size?: 'sm' | 'md'
}

export const CopyButton: FC<Props> = ({
  textToCopy,
  tooltipLabel,
  size = 'md',
}) => {
  const { isCopied, copy } = useCopy()

  const handleCopy = () => {
    copy(textToCopy)
  }

  return (
    <IconButton
      size={size}
      icon={isCopied ? <Check /> : <Copy />}
      tooltipContent={isCopied ? 'Copied!' : tooltipLabel}
      onClick={handleCopy}
    />
  )
}
