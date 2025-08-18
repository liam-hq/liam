'use client'

import type { Schema } from '@liam-hq/schema'
import type { Version } from '../types'

type UsePublicRealtimeVersionsWithSchemaParams = {
  buildingSchemaId: string
  initialVersions: Version[]
  initialDisplayedSchema: Schema
  initialPrevSchema: Schema
}

export function usePublicRealtimeVersionsWithSchema({
  initialVersions,
  initialDisplayedSchema,
  initialPrevSchema,
}: UsePublicRealtimeVersionsWithSchemaParams) {
  // TODO: Consider enabling realtime updates for public view
  // Currently returns static data from initial load
  // Select the latest version (first in the array) as the default
  const selectedVersion = initialVersions.length > 0 ? initialVersions[0] : null

  return {
    versions: initialVersions,
    selectedVersion,
    setSelectedVersion: () => {},
    displayedSchema: initialDisplayedSchema,
    prevSchema: initialPrevSchema,
  }
}
