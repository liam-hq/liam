import type { FC } from 'react'
import { getProjects } from '@/components/CommonLayout/AppBar/ProjectsDropdownMenu/services/getProjects'
import { getOrganizationId } from '@/features/organizations/services/getOrganizationId'
import { SessionForm } from './SessionForm'

type Props = {
  defaultProjectId?: string
}

export const SessionFormContainer: FC<Props> = async ({ defaultProjectId }) => {
  const organizationId = await getOrganizationId()
  const { data: projects } = await getProjects(organizationId)

  return (
    <SessionForm
      projects={projects ?? []}
      defaultProjectId={defaultProjectId}
    />
  )
}
