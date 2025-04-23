import type { PageProps } from '@/app/types'
import { ProjectNewPage } from '@/features/projects/pages'
import { getAuthenticatedUser, getSessionForGitHubApi } from '@/libs/auth'
import { createClient } from '@/libs/db/server'
import { getInstallations } from '@liam-hq/github'
import { notFound } from 'next/navigation'
import * as v from 'valibot'

const paramsSchema = v.object({
  organizationId: v.string(),
})

export default async function NewProjectPage({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) return notFound()

  const { organizationId } = parsedParams.output
  const supabase = await createClient()
  const user = await getAuthenticatedUser()

  if (!user) {
    return notFound()
  }

  const { data: organizationMembers, error: orgError } = await supabase
    .from('organization_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('organization_id', organizationId)
    .limit(1)

  if (orgError) {
    console.error('Error fetching organization members:', orgError)
  }

  if (!organizationMembers || organizationMembers.length === 0) {
    return notFound()
  }

  const session = await getSessionForGitHubApi()
  const { installations } = await getInstallations(session)

  return (
    <ProjectNewPage
      installations={installations}
      organizationId={organizationId}
    />
  )
}
