import type { PageProps } from '@/app/types'
import { ProjectsPage } from '@/features/projects/pages'
import { migrationFlag } from '@/libs'
import { getAuthenticatedUser } from '@/libs/auth'
import { createClient } from '@/libs/db/server'
import { notFound } from 'next/navigation'
import * as v from 'valibot'

const paramsSchema = v.object({
  organizationId: v.string(),
})

export default async function Page({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) return notFound()
  const { organizationId } = parsedParams.output

  const migrationEnabled = await migrationFlag()

  if (!migrationEnabled) {
    notFound()
  }

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

  return <ProjectsPage organizationId={organizationId} />
}
