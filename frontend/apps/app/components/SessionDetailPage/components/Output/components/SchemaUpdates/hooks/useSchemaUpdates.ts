import type { Schema } from '@liam-hq/db-structure'
import { useCallback, useEffect, useState } from 'react'
import { buildCurrentSchema } from '@/components/SessionDetailPage/services/buildCurrentSchema'
import { createClient } from '@/libs/db/client'
// Note: buildPrevSchema is not used in this implementation
import { generateDiffDdl, schemaToDdl } from '../utils/schemaToDdl'

type UseSchemaUpdatesProps = {
  designSessionId: string
  currentVersionNumber?: number
}

type UseSchemaUpdatesResult = {
  cumulativeDdl: string
  prevCumulativeDdl: string
  diffDdl: string
  loading: boolean
  error: string | null
}

export const useSchemaUpdates = ({
  designSessionId,
  currentVersionNumber,
}: UseSchemaUpdatesProps): UseSchemaUpdatesResult => {
  const [currentSchema, setCurrentSchema] = useState<Schema | null>(null)
  const [prevSchema, setPrevSchema] = useState<Schema | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Helper function to get latest version number
  const getLatestVersionNumber = useCallback(async (): Promise<
    number | null
  > => {
    const { data: buildingSchema } = await supabase
      .from('building_schemas')
      .select('id')
      .eq('design_session_id', designSessionId)
      .single()

    if (!buildingSchema) return null

    const { data: latestVersion } = await supabase
      .from('building_schema_versions')
      .select('number')
      .eq('building_schema_id', buildingSchema.id)
      .order('number', { ascending: false })
      .limit(1)
      .single()

    return latestVersion?.number || null
  }, [designSessionId, supabase])

  // Helper function to build schemas
  const buildSchemas = useCallback(
    async (targetVersionNumber: number) => {
      const current = await buildCurrentSchema({
        designSessionId,
        latestVersionNumber: targetVersionNumber,
      })
      setCurrentSchema(current)

      // Build previous schema (one version before current)
      if (targetVersionNumber > 1) {
        const prev = await buildCurrentSchema({
          designSessionId,
          latestVersionNumber: targetVersionNumber - 1,
        })
        setPrevSchema(prev)
      } else {
        setPrevSchema(null)
      }
    },
    [designSessionId],
  )

  // Fetch and build schemas
  const fetchSchemas = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // If no version specified, fetch latest version number first
      let targetVersionNumber = currentVersionNumber
      if (!targetVersionNumber) {
        const latestVersion = await getLatestVersionNumber()
        targetVersionNumber = latestVersion || undefined
      }

      if (targetVersionNumber) {
        await buildSchemas(targetVersionNumber)
      } else {
        setCurrentSchema(null)
        setPrevSchema(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [currentVersionNumber, getLatestVersionNumber, buildSchemas])

  // Set up realtime subscription
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      // Get building_schema_id for subscription
      const { data: buildingSchema } = await supabase
        .from('building_schemas')
        .select('id')
        .eq('design_session_id', designSessionId)
        .single()

      if (!buildingSchema) {
        return
      }

      // Subscribe to building_schema_versions changes
      const subscription = supabase
        .channel('schema-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'building_schema_versions',
            filter: `building_schema_id=eq.${buildingSchema.id}`,
          },
          (_payload: unknown) => {
            // Refetch schemas when changes occur
            fetchSchemas()
          },
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }

    setupRealtimeSubscription()
  }, [designSessionId, fetchSchemas, supabase])

  // Initial fetch
  useEffect(() => {
    fetchSchemas()
  }, [fetchSchemas])

  // Generate DDL from schemas
  const cumulativeDdl = (() => {
    if (!currentSchema) return ''

    const result = schemaToDdl(currentSchema)
    return result.ddl
  })()

  const prevCumulativeDdl = (() => {
    if (!prevSchema) return ''

    const result = schemaToDdl(prevSchema)
    return result.ddl
  })()

  const diffDdl = (() => {
    if (!currentSchema || !prevSchema) return ''

    const result = generateDiffDdl(currentSchema, prevSchema)
    return result.ddl
  })()

  return {
    cumulativeDdl,
    prevCumulativeDdl,
    diffDdl,
    loading,
    error,
  }
}
