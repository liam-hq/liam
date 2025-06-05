import { createClient } from '@/libs/db/server'
import {
  type CreateVersionParams,
  type VersionResponse,
  createNewVersion as createNewVersionShared,
} from '@liam-hq/schema-operations'

export async function createNewVersion(
  params: CreateVersionParams,
): Promise<VersionResponse> {
  const supabase = await createClient()
  return createNewVersionShared(supabase, params)
}
