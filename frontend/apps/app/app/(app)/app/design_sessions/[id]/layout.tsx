import type { ReactNode } from 'react'
import { CommonLayout } from '@/components/CommonLayout'
import { getDesignSessionWithTimelineItems } from '@/components/SessionDetailPage/services/designSessionWithTimelineItems/server/getDesignSessionWithTimelineItems'

type Props = {
  children: ReactNode
  params: Promise<{ id: string }>
}

export default async function DesignSessionLayout({ children, params }: Props) {
  const { id: designSessionId } = await params

  const designSession = await getDesignSessionWithTimelineItems(designSessionId)
  const projectId = designSession?.project_id || undefined

  return (
    <CommonLayout projectId={projectId} designSessionId={designSessionId}>
      {children}
    </CommonLayout>
  )
}
