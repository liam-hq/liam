import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient()

export { createServerClient, createBrowserClient } from '@supabase/ssr'
export type { EmailOtpType, Session } from '@supabase/supabase-js'
