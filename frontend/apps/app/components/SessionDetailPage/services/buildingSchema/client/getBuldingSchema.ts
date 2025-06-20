import { createClient } from '@/libs/db/client'
import type { BuildingSchema } from '../../../types'
import { fetchBuildingSchema } from '../fetchBuildingSchema'

export async function getBuildingSchema(
  designSessionId: string,
): Promise<BuildingSchema | null> {
  const supabase = createClient()

  return await fetchBuildingSchema(supabase, designSessionId)
}
