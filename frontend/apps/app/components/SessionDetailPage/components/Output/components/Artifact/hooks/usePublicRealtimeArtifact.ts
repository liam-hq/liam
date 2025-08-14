'use client'

import type { Artifact } from '@liam-hq/artifact'

export function usePublicRealtimeArtifact(
  _designSessionId: string,
  initialArtifact: Artifact | null = null,
) {
  // Public view does not support realtime updates
  // Return initial artifact data without any updates
  return {
    artifact: initialArtifact,
    loading: false,
    error: null,
  }
}
