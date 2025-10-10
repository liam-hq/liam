'use client'

import type { AnalyzedRequirements } from '@liam-hq/artifact'
import type { FC } from 'react'
import { Artifact } from './Artifact'
import { formatArtifactToMarkdown } from './utils'

type Props = {
  analyzedRequirements?: AnalyzedRequirements | null
}

export const ArtifactContainer: FC<Props> = ({ analyzedRequirements }) => {
  if (!analyzedRequirements) {
    return <div>No artifact available yet</div>
  }

  const markdownContent = formatArtifactToMarkdown({
    requirement: analyzedRequirements,
  })
  return <Artifact doc={markdownContent} error={null} />
}
