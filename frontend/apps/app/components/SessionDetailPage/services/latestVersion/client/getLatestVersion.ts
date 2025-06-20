import { createClient } from '@/libs/db/client'
import type { Version } from '../../../types'
import { fetchLatestVersion } from '../fetchLatestVersion'

export async function getLatestVersion(
  buildingSchemaId: string,
): Promise<Version | null> {
  const supabase = createClient()

  return await fetchLatestVersion(supabase, buildingSchemaId)
}
