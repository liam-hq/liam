import { createBrowserClient as _createBrowserClient, createServerClient as _createServerClient, } from '@supabase/ssr';
import { createClient as _createClient } from '@supabase/supabase-js';
// for Server Components
export const createServerClient = (_createServerClient);
// for Client Components
export const createBrowserClient = (_createBrowserClient);
// for Jobs
export const createClient = (_createClient);
