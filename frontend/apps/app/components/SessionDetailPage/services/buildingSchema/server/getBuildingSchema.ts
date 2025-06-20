'use server'

import { createClient } from '@/libs/db/server'
import type { BuildingSchema } from '../../../types'
import { fetchBuildingSchema } from '../fetchBuildingSchema'

export async function getBuildingSchema(
  designSessionId: string,
): Promise<BuildingSchema | null> {
  const supabase = await createClient()

  return await fetchBuildingSchema(supabase, designSessionId)
}
