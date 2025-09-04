'use server'

import { type Result, ResultAsync } from 'neverthrow'
import { createClient } from '../../../../../libs/db/server'
import type { DesignSessionWithTimelineItems } from '../../../types'
import { fetchDesignSessionWithTimelineItems } from '../fetchDesignSessionWithTimelineItems'

export async function getDesignSessionWithTimelineItems(
  designSessionId: string,
): Promise<Result<DesignSessionWithTimelineItems, Error>> {
  return await ResultAsync.fromSafePromise(createClient()).andThen((supabase) =>
    fetchDesignSessionWithTimelineItems(supabase, designSessionId),
  )
}
