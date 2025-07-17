'use client'

import {
  applyPatchOperations,
  operationsSchema,
  type Schema,
  schemaSchema,
} from '@liam-hq/db-structure'
import * as v from 'valibot'
import type { Version } from '@/components/SessionDetailPage/types'
import { createClient } from '@/libs/db/client'

async function getPreviousVersions(
  buildingSchemaId: string,
  latestVersionNumber: number,
) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('building_schema_versions')
    .select('number, patch')
    .eq('building_schema_id', buildingSchemaId)
    .lte('number', latestVersionNumber)
    .order('number', { ascending: true })

  if (error) {
    return []
  }

  return data
}

export async function buildCurrentSchema(targetVersion: Version) {
  const supabase = createClient()
  const { data: buildingSchema } = await supabase
    .from('building_schemas')
    .select('id, initial_schema_snapshot')
    .eq('id', targetVersion.building_schema_id)
    .single()

  const previousVersions = await getPreviousVersions(
    buildingSchema?.id ?? '',
    targetVersion.number,
  )

  const operationsArray = previousVersions
    .map((version) => {
      const parsed = v.safeParse(operationsSchema, version.patch)
      if (!parsed.success) return null

      return parsed.output
    })
    .filter((version) => version !== null)

  const parsedInitialSchema = v.safeParse(
    schemaSchema,
    buildingSchema?.initial_schema_snapshot,
  )

  const baseSchema: Schema = parsedInitialSchema.success
    ? parsedInitialSchema.output
    : {
        tables: {},
      }

  const currentSchema: Schema = structuredClone(baseSchema)
  for (const operations of operationsArray) {
    applyPatchOperations(currentSchema, operations)
  }

  return currentSchema
}
