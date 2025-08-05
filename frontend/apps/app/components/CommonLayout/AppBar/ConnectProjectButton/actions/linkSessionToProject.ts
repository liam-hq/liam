'use server'

import { err, type Result } from 'neverthrow'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import * as v from 'valibot'
import { createClient } from '@/libs/db/server'

const linkSessionSchema = v.object({
  sessionId: v.string(),
  projectId: v.string(),
})

export async function linkSessionToProject(
  sessionId: string,
  projectId: string,
): Promise<Result<void, string>> {
  const validatedData = v.parse(linkSessionSchema, { sessionId, projectId })

  const supabase = await createClient()

  const { error } = await supabase
    .from('design_sessions')
    .update({ project_id: validatedData.projectId })
    .eq('id', validatedData.sessionId)

  if (error) {
    console.error('Failed to link session to project:', error)
    return err('Failed to link session to project')
  }

  revalidatePath(`/app/design_sessions/${validatedData.sessionId}`)
  redirect(
    `/app/projects/${validatedData.projectId}/sessions/${validatedData.sessionId}`,
  )
}
