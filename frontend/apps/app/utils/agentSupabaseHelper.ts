import {
  type CreateVersionParams,
  createSupabaseRepositories,
} from '@liam-hq/agent'
import { createClient } from '@/libs/db/server'

async function createRepositories() {
  const client = await createClient()

  return createSupabaseRepositories(client)
}

export async function createNewVersion(params: CreateVersionParams) {
  const repositories = await createRepositories()
  return repositories.schema.createVersion(params)
}
