'use client'

import type { Schema } from '@liam-hq/schema'
import { useRealtimeArtifact } from '@/components/SessionDetailPage/components/Output/components/Artifact/hooks/useRealtimeArtifact'
import { usePublicRealtimeTimelineItems } from '@/components/SessionDetailPage/hooks/usePublicRealtimeTimelineItems'
import { usePublicRealtimeVersionsWithSchema } from '@/components/SessionDetailPage/hooks/usePublicRealtimeVersionsWithSchema'
import { usePublicRealtimeWorkflowRuns } from '@/components/SessionDetailPage/hooks/usePublicRealtimeWorkflowRuns'
import { useRealtimeTimelineItems } from '@/components/SessionDetailPage/hooks/useRealtimeTimelineItems'
import { useRealtimeVersionsWithSchema } from '@/components/SessionDetailPage/hooks/useRealtimeVersionsWithSchema'
import { useRealtimeWorkflowRuns } from '@/components/SessionDetailPage/hooks/useRealtimeWorkflowRuns'
import type {
  TimelineItemEntry,
  Version,
  WorkflowRunStatus,
} from '@/components/SessionDetailPage/types'
import { useViewMode } from './useViewMode'

// Versions Hook
type VersionsConfig = {
  buildingSchemaId: string
  initialVersions: Version[]
  initialDisplayedSchema: Schema
  initialPrevSchema: Schema
}

export const useAdaptiveRealtimeVersions = (config: VersionsConfig) => {
  const { isPublic } = useViewMode()

  const publicResult = usePublicRealtimeVersionsWithSchema(config)
  const privateResult = useRealtimeVersionsWithSchema(config)

  return isPublic ? publicResult : privateResult
}

// Timeline Items Hook
export const useAdaptiveRealtimeTimelineItems = (
  designSessionId: string,
  initialItems: TimelineItemEntry[],
) => {
  const { isPublic } = useViewMode()

  const publicResult = usePublicRealtimeTimelineItems(
    designSessionId,
    initialItems,
  )
  const privateResult = useRealtimeTimelineItems(designSessionId, initialItems)

  return isPublic ? publicResult : privateResult
}

// Workflow Runs Hook
export const useAdaptiveRealtimeWorkflowRuns = (
  designSessionId: string,
  initialStatus: WorkflowRunStatus | null,
) => {
  const { isPublic } = useViewMode()

  const publicResult = usePublicRealtimeWorkflowRuns(
    designSessionId,
    initialStatus,
  )
  const privateResult = useRealtimeWorkflowRuns(designSessionId, initialStatus)

  return isPublic ? publicResult : privateResult
}

// Artifact Hook
export const useAdaptiveRealtimeArtifact = (designSessionId: string) => {
  // Both public and private views now use the same realtime artifact hook
  // RLS policies on the database ensure proper access control
  return useRealtimeArtifact(designSessionId)
}
