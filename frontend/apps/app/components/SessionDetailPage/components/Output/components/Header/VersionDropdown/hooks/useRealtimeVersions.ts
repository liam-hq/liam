'use client'

import { useCallback, useEffect, useState } from 'react'
import * as v from 'valibot'
import { createClient } from '@/libs/db/client'

const realtimeVersionSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  number: v.number(),
  building_schema_id: v.pipe(v.string(), v.uuid()),
})

export function useRealtimeVersions(
  designSessionId: string,
  onVersionsUpdate: (designSessionId: string) => void,
) {
  const [error, setError] = useState<Error | null>(null)
  const [buildingSchemaId, setBuildingSchemaId] = useState<string | null>(null)

  const handleError = useCallback((err: unknown) => {
    setError(
      err instanceof Error
        ? err
        : new Error('Realtime versions update processing failed'),
    )
  }, [])

  // Get building_schema_id for filtering
  useEffect(() => {
    const fetchBuildingSchemaId = async () => {
      const supabase = createClient()

      const { data: buildingSchema, error: buildingSchemaError } =
        await supabase
          .from('building_schemas')
          .select('id')
          .eq('design_session_id', designSessionId)
          .single()

      if (buildingSchemaError || !buildingSchema) {
        handleError(
          new Error(
            'Failed to fetch building schema for realtime subscription',
          ),
        )
        return
      }

      setBuildingSchemaId(buildingSchema.id)
    }

    fetchBuildingSchemaId()
  }, [designSessionId, handleError])

  useEffect(() => {
    if (!buildingSchemaId) return

    const supabase = createClient()

    const channel = supabase
      .channel(`building_schema_versions:${buildingSchemaId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'building_schema_versions',
          filter: `building_schema_id=eq.${buildingSchemaId}`,
        },
        (payload) => {
          try {
            const parsed = v.safeParse(
              realtimeVersionSchema,
              payload.new || payload.old,
            )
            if (!parsed.success) {
              throw new Error('Invalid payload for realtime versions update')
            }

            const updatedVersion = parsed.output
            // Validate that the version belongs to the correct building schema
            if (updatedVersion.building_schema_id === buildingSchemaId) {
              // NOTE: The payload contains the correct updated version data,
              // but we intentionally use the regular PostgREST client to re-fetch
              // the complete versions list to ensure consistency
              onVersionsUpdate(designSessionId)
            }
          } catch (error) {
            handleError(error)
          }
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          handleError(new Error('Versions realtime subscription failed'))
        }
      })

    return () => {
      channel.unsubscribe()
    }
  }, [buildingSchemaId, designSessionId, onVersionsUpdate, handleError])

  return {
    error,
  }
}
