'use client'

import { type Artifact, artifactSchema } from '@liam-hq/artifact'
import { useCallback, useEffect, useState } from 'react'
import * as v from 'valibot'
import { createClient } from '@/libs/db/client'
import { useViewMode } from '../../../../../hooks/viewMode'

const artifactDataSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  design_session_id: v.pipe(v.string(), v.uuid()),
  artifact: artifactSchema,
  created_at: v.string(),
  updated_at: v.string(),
  organization_id: v.pipe(v.string(), v.uuid()),
})

export function useRealtimeArtifact(designSessionId: string) {
  const { isPublic } = useViewMode()
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
      // For public view, check if it's a permission error (expected when no artifact exists)
      if (isPublic && fetchError.code === 'PGRST116') {
        // This is expected - no artifact exists yet for this session
        setLoading(false)
        return
      }

      // Check if this is a real error or just no data
      const hasErrorContent =
        fetchError.message ||
        fetchError.code ||
        fetchError.details ||
        Object.keys(fetchError).length > 0

      if (hasErrorContent && fetchError.code !== 'PGRST116') {
        // Only log if there's actual error content and it's not a "no rows" error
        console.error('Error fetching artifact:', {
          message: fetchError.message || 'No message',
          code: fetchError.code || 'No code',
          hint: fetchError.hint || 'No hint',
          details: JSON.stringify(fetchError),
        })
      }

      // Don't set error state for empty responses or permission errors in public view
      if (fetchError.message && fetchError.code !== 'PGRST116') {
        handleError(fetchError)
      }

      setLoading(false)
      return
    }

    if (!data) {
      setArtifact(null)
      setLoading(false)
      return
    }

    // Validate artifact data
    const artifactData = v.safeParse(artifactDataSchema, data)
    if (artifactData.success) {
      setArtifact(artifactData.output.artifact)
    } else {
      console.error('Invalid artifact data schema:', artifactData.issues)
      handleError(new Error('Invalid artifact data schema'))
    }

    setLoading(false)
  }, [designSessionId, handleError])

  // Initial fetch
  useEffect(() => {
    fetchArtifact()
  }, [fetchArtifact])

  // Set up realtime subscription
  useEffect(() => {
    // Skip realtime subscription for public view
    if (isPublic) return

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
            setArtifact(validatedData.artifact)
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
  }, [designSessionId, handleError, isPublic])

  return {
    artifact,
    loading,
    error,
  }
}
