import { ProjectSessionsPage } from '@/components/ProjectSessionsPage'
import type { FC } from 'react'

type Props = {
  params: Promise<{
    projectId: string
    branchOrCommit: string
  }>
}

const SessionsPage: FC<Props> = async ({ params }) => {
  const { projectId } = await params

  return <ProjectSessionsPage projectId={projectId} />
}

export default SessionsPage
