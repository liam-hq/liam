'use client'

import { buildingSchemaVersionsSchema } from '@liam-hq/db'
import { type Schema, schemaSchema } from '@liam-hq/db-structure'
import { useCallback, useEffect, useState, useTransition } from 'react'
import * as v from 'valibot'
import { createClient } from '@/libs/db/client'
import type { Version } from '../../types'
import { buildCurrentSchema } from './services/buildCurrentSchema'
import { buildPrevSchema } from './services/buildPrevSchema'

type Params = {
  buildingSchemaId: string
  initialVersions: Version[]
  initialDisplayedSchema: Schema
  initialPrevSchema: Schema
}

export function useRealtimeVersionsWithSchema({
  buildingSchemaId,
  initialVersions,
  initialDisplayedSchema,
  initialPrevSchema,
}: Params) {
  const [isPending, startTransition] = useTransition()
  const [versions, setVersions] = useState<Version[]>(initialVersions)
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(
    initialVersions[0] ?? null,
  )

  const [displayedSchema, setDisplayedSchema] = useState<Schema>(
    initialDisplayedSchema,
  )
  const [prevSchema, setPrevSchema] = useState<Schema>(initialPrevSchema)

  const [error, setError] = useState<Error | null>(null)
  const handleError = useCallback((err: unknown) => {
    setError(
      err instanceof Error
        ? err
        : new Error('Realtime versions update processing failed'),
    )
  }, [])

  const handleBuildCurrentAndPrevSchema = useCallback(
    (targetVersion: Version | null) => {
      if (targetVersion === null) return

      startTransition(async () => {
        try {
          const buildingSchema = await buildCurrentSchema(targetVersion)
          const parsed = v.safeParse(schemaSchema, buildingSchema)
          if (!parsed.success) {
            handleError(new Error('Invalid schema format'))
            return
          }
          const currentSchema = parsed.output
          setDisplayedSchema(currentSchema)
          const newPrevSchema = await buildPrevSchema({
            currentSchema,
            targetVersionId: targetVersion.id,
          })
          setPrevSchema(newPrevSchema ?? currentSchema)
        } catch (error) {
          handleError(error)
        }
      })
    },
    [],
  )

  const handleAddOrUpdateVersion = useCallback((version: Version) => {
    setVersions((prev) => {
      const existingVersionIndex = prev.findIndex((v) => v.id === version.id)
      let updatedVersions: Version[]
      if (existingVersionIndex >= 0) {
        updatedVersions = [...prev]
        updatedVersions[existingVersionIndex] = version
      } else {
        const newVersions = [...prev, version]
        updatedVersions = newVersions.sort((a, b) => b.number - a.number)
      }
      return updatedVersions
    })
  }, [])

  useEffect(() => {
    setSelectedVersion(versions[0] ?? null)
  }, [versions])

  useEffect(() => {
    handleBuildCurrentAndPrevSchema(selectedVersion)
  }, [selectedVersion, handleBuildCurrentAndPrevSchema])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`building_schema_versions:${buildingSchemaId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'building_schema_versions',
          filter: `building_schema_id=eq.${buildingSchemaId}`,
        },
        (payload) => {
          try {
            const parsed = v.safeParse(
              buildingSchemaVersionsSchema,
              payload.new,
            )
            if (!parsed.success) {
              handleError(new Error('Invalid building schema version format'))
              return
            }

            const updatedVersion = parsed.output
            handleAddOrUpdateVersion(updatedVersion)
          } catch (error) {
            handleError(error)
          }
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          handleError(new Error('Failed to subscribe to versions'))
        }
      })

    return () => {
      channel.unsubscribe()
    }
  }, [buildingSchemaId, handleError, handleAddOrUpdateVersion])

  return {
    isPending,
    versions,
    selectedVersion,
    setSelectedVersion,
    displayedSchema,
    prevSchema,
    error,
  }
}
