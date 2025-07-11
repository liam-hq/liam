'use server'

import { createClient } from '@/libs/db/server'
import { fetchDesignSessionWithTimelineItems } from '../fetchDesignSessionWithTimelineItems'

export async function getDesignSessionWithTimelineItems(
  designSessionId: string,
) {
  const supabase = await createClient()

  return await fetchDesignSessionWithTimelineItems(supabase, designSessionId)
}
