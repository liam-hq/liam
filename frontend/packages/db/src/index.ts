import { PrismaClient } from '@prisma/client'
import {
  createBrowserClient as _createBrowserClient,
  createServerClient as _createServerClient,
} from '@supabase/ssr'
import type { Database } from '../supabase/database.types'

export const prisma = new PrismaClient()

export type { EmailOtpType, Session } from '@supabase/supabase-js'
export const createServerClient = _createServerClient<Database>
export const createBrowserClient = _createBrowserClient<Database>
