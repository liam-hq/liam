'use server'

import { createClient } from '@/libs/db/server'
import type { Version } from '../../../types'
import { fetchLatestVersion } from '../fetchLatestVersion'

export async function getLatestVersion(
  buildingSchemaId: string,
): Promise<Version | null> {
  const supabase = await createClient()

  return await fetchLatestVersion(supabase, buildingSchemaId)
}
