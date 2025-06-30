'use client'

import { type Artifact, artifactSchema } from '@liam-hq/db-structure'
import { useCallback, useEffect, useState } from 'react'
import * as v from 'valibot'
import { createClient } from '@/libs/db/client'

const artifactDataSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  design_session_id: v.pipe(v.string(), v.uuid()),
  artifact: v.unknown(),
  created_at: v.string(),
  updated_at: v.string(),
  organization_id: v.pipe(v.string(), v.uuid()),
})

export function useRealtimeArtifact(designSessionId: string) {
  const [artifact, setArtifact] = useState<Artifact | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const handleError = useCallback((err: unknown) => {
    setError(
      err instanceof Error ? err : new Error('Artifact processing failed'),
    )
  }, [])

  // Fetch artifact data
  const fetchArtifact = useCallback(async () => {
    setError(null) // Clear previous errors
    const supabase = createClient()
    const { data, error: fetchError } = await supabase
      .from('artifacts')
      .select('*')
      .eq('design_session_id', designSessionId)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching artifact:', fetchError)
      handleError(fetchError)
      setLoading(false)
      return
    }

    if (!data) {
      setArtifact(null)
      setLoading(false)
      return
    }

    // Validate artifact content
    const artifactContent = v.safeParse(artifactSchema, data.artifact)
    if (artifactContent.success) {
      setArtifact(artifactContent.output)
    } else {
      console.error('Invalid artifact schema:', artifactContent.issues)
      handleError(new Error('Invalid artifact schema'))
    }

    setLoading(false)
  }, [designSessionId, handleError])

  // Initial fetch
  useEffect(() => {
    fetchArtifact()
  }, [fetchArtifact])

  // Set up realtime subscription
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`artifacts:${designSessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'artifacts',
          filter: `design_session_id=eq.${designSessionId}`,
        },
        (payload) => {
          try {
            if (payload.eventType === 'DELETE') {
              setArtifact(null)
              return
            }

            const validatedData = v.parse(artifactDataSchema, payload.new)
            const artifactContent = v.safeParse(
              artifactSchema,
              validatedData.artifact,
            )

            if (artifactContent.success) {
              setArtifact(artifactContent.output)
            } else {
              throw new Error('Invalid artifact schema in realtime update')
            }
          } catch (error) {
            handleError(error)
          }
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          handleError(new Error('Artifact realtime subscription failed'))
        }
      })

    return () => {
      channel.unsubscribe()
    }
  }, [designSessionId, handleError])

  return {
    artifact,
    loading,
    error,
  }
}
