import {
  createBrowserClient as _createBrowserClient,
  createServerClient as _createServerClient,
} from '@supabase/ssr'
import { createClient as _createClient } from '@supabase/supabase-js'
import type { AppDatabaseOverrides } from './types'

export type {
  EmailOtpType,
  QueryData,
  Session,
  SupabaseClient,
} from '@supabase/supabase-js'
export type { Database, Json, Tables } from '../supabase/database.types'
export * from './factories'
export * from './schema'
export type { AppDatabaseOverrides } from './types'
export { retry } from './utils/retry'
export { toResultAsync } from './utils/toResultAsync'

export type SupabaseClientType = ReturnType<typeof createServerClient>

// for Server Components
export const createServerClient = _createServerClient<AppDatabaseOverrides>

// for Client Components
export const createBrowserClient = _createBrowserClient<AppDatabaseOverrides>

// for Jobs
export const createClient = _createClient<AppDatabaseOverrides>
