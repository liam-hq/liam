'use client'

import type {
  AnalyzedRequirements,
  Artifact as ArtifactType,
} from '@liam-hq/artifact'
import type { FC } from 'react'
import { Artifact } from './Artifact'
import { formatArtifactToMarkdown } from './utils'

type Props = {
  artifact: ArtifactType | null
  error: Error | null
  analyzedRequirements?: AnalyzedRequirements | null
}

export const ArtifactContainer: FC<Props> = ({
  artifact,
  error,
  analyzedRequirements,
}) => {
  const displayData =
    analyzedRequirements !== null && analyzedRequirements !== undefined
      ? { requirement: analyzedRequirements }
      : artifact

  if (!displayData) {
    return <div>No artifact available yet</div>
  }

  const markdownContent = formatArtifactToMarkdown(displayData)
  return <Artifact doc={markdownContent} error={error} />
}
