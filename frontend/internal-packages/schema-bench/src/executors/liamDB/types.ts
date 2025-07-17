import type { Schema } from '@liam-hq/db-structure'

type LiamDBExecutorInput = {
  input: string
}

type LiamDBExecutorOutput = {} & Schema

type LiamDBExecutorConfig = {
  supabaseUrl: string
  supabaseAnonKey: string
  organizationId: string
  timeout?: number
}
