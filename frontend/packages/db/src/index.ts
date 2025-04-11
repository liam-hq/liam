import {
  createBrowserClient as _createBrowserClient,
  createServerClient as _createServerClient,
} from '@supabase/ssr'
import { createClient as _createClient } from '@supabase/supabase-js'
import type { Database } from '../supabase/database.types'

export type { EmailOtpType } from '@supabase/supabase-js'
export type { Database } from '../supabase/database.types'
export type { Tables } from '../supabase/database.types'

// for Server Components
export const createServerClient = _createServerClient<Database>

// for Client Components
export const createBrowserClient = _createBrowserClient<Database>

// for Jobs
export const createClient = _createClient<Database>
