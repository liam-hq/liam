'use client'

import type { FC } from 'react'
import { Artifact } from './Artifact'
import { useRealtimeArtifact } from './hooks/useRealtimeArtifact'
import { formatArtifactToMarkdown } from './utils/formatArtifactToMarkdown'

type Props = {
  designSessionId: string
}

export const ArtifactContainer: FC<Props> = ({ designSessionId }) => {
  const { artifact, loading, error } = useRealtimeArtifact(designSessionId)

  if (loading) {
    return <div>Loading artifact...</div>
  }

  if (error) {
    return <div>Error loading artifact: {error.message}</div>
  }

  if (!artifact) {
    return <div>No artifact available yet</div>
  }

  // Convert artifact data to markdown format
  const markdownContent = formatArtifactToMarkdown(artifact)

  return <Artifact doc={markdownContent} />
}
