'use client'

import type { Artifact as ArtifactType } from '@liam-hq/artifact'
import type { FC } from 'react'
import { Artifact } from './Artifact'
import { formatArtifactToMarkdown } from './utils/formatArtifactToMarkdown'

type Props = {
  artifact: ArtifactType | null
  loading: boolean
  error: Error | null
}

export const ArtifactContainer: FC<Props> = ({ artifact, loading, error }) => {
  if (loading) {
    return <div>Loading artifact...</div>
  }

  if (error) {
    return <div>Error loading artifact: {error.message}</div>
  }

  if (!artifact) {
    return <div>No artifact available yet</div>
  }

  const markdownContent = formatArtifactToMarkdown(artifact)
  return <Artifact doc={markdownContent} />
}
