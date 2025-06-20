'use client'

import { useCallback, useEffect, useState } from 'react'
import * as v from 'valibot'
import { createClient } from '@/libs/db/client'

const realtimeBuildingSchemaSchema = v.object({
  design_session_id: v.pipe(v.string(), v.uuid()),
})

export function useRealtimeBuildlingSchema(
  designSessionId: string,
  onSchemaUpdate: (designSessionId: string) => void,
) {
  const [error, setError] = useState<Error | null>(null)

  const handleError = useCallback((err: unknown) => {
    setError(
      err instanceof Error
        ? err
        : new Error('Realtime update processing failed'),
    )
  }, [])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`building_schemas:${designSessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'building_schemas',
          filter: `design_session_id=eq.${designSessionId}`,
        },
        (payload) => {
          try {
            const parsed = v.safeParse(
              realtimeBuildingSchemaSchema,
              payload.new,
            )
            if (!parsed.success) {
              throw new Error('Invalid payload for realtime update')
            }

            const updatedBuildingSchema = parsed.output
            // Only validate that we have a valid design_session_id
            if (updatedBuildingSchema.design_session_id === designSessionId) {
              // NOTE: The payload contains the correct updated schema (structurally correct),
              // but the JSON key order often differs from the DB order, so we intentionally
              // use the regular PostgREST client to re-fetch the data
              onSchemaUpdate(designSessionId)
            }
          } catch (error) {
            handleError(error)
          }
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          handleError(new Error('Schema realtime subscription failed'))
        }
      })

    return () => {
      channel.unsubscribe()
    }
  }, [designSessionId, onSchemaUpdate, handleError])

  return {
    error,
  }
}
