'use client'

import type { BaseMessage } from '@langchain/core/messages'
import type { AnalyzedRequirements } from '@liam-hq/agent/client'
import type { FC } from 'react'
import { Artifact } from './Artifact'
import { GenerationStatus } from './GenerationStatus'
import { formatArtifactToMarkdown } from './utils'
import { getArtifactGenerationStatus } from './utils/getArtifactGenerationStatus'

type Props = {
  analyzedRequirements?: AnalyzedRequirements | null
  messages?: BaseMessage[]
  isStreaming?: boolean
}

export const ArtifactContainer: FC<Props> = ({
  analyzedRequirements,
  messages = [],
  isStreaming = false,
}) => {
  const { phase, isGenerating } = getArtifactGenerationStatus(
    messages,
    isStreaming,
    analyzedRequirements,
  )

  if (!analyzedRequirements) {
    return (
      <div>
        {isGenerating && <GenerationStatus phase={phase} />}
        {!isGenerating && <div>No artifact available yet</div>}
      </div>
    )
  }

  const markdownContent = formatArtifactToMarkdown(analyzedRequirements)
  return (
    <>
      {isGenerating && <GenerationStatus phase={phase} />}
      <Artifact doc={markdownContent} error={null} />
    </>
  )
}
