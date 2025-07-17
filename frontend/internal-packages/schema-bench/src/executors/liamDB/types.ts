import type { Schema } from '@liam-hq/db-structure'

export type LiamDBExecutorInput = {
  input: string
}

export type LiamDBExecutorOutput = {} & Schema

export type LiamDBExecutorConfig = {
  supabaseUrl: string
  supabaseAnonKey: string
  organizationId: string
  timeout?: number
}
