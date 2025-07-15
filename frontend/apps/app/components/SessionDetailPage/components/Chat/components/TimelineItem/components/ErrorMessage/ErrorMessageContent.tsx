'use client'

import type { FC } from 'react'
import { MarkdownContent } from '@/components/MarkdownContent'

type ErrorMessageContentProps = {
  content: string
}

export const ErrorMessageContent: FC<ErrorMessageContentProps> = ({
  content,
}) => {
  return <MarkdownContent content={content} />
}
