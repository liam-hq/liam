import {
  applyPatchOperations,
  operationsSchema,
  type Schema,
  schemaSchema,
} from '@liam-hq/db-structure'
import { safeParse } from 'valibot'
import { createClient } from '@/libs/db/client'
import { getBuildingSchema } from './buildingSchema/client/getBuldingSchema'

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

type Params = {
  designSessionId: string
  latestVersionNumber: number
}

export async function buildCurrentSchema({
  designSessionId,
  latestVersionNumber,
}: Params) {
  const buildingSchema = await getBuildingSchema(designSessionId)

  const previousVersions = await getPreviousVersions(
    buildingSchema?.id ?? '',
    latestVersionNumber,
  )

  const operationsArray = previousVersions
    .map((version) => {
      const parsed = safeParse(operationsSchema, version.patch)
      if (!parsed.success) return null

      return parsed.output
    })
    .filter((version) => version !== null)

  const parsedInitialSchema = safeParse(
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
