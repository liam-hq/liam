import type { Schema } from '@liam-hq/db-structure'
import type { FC } from 'react'
import { SessionDetailContent } from './components/SessionDetailContent'
import { SchemaProvider } from './providers/SchemaProvider'

type DesignSession = {
  id: string
  organizationId: string
  messages: Array<{
    id: string
    content: string
    role: 'user' | 'assistant' | 'schema_version' | 'error'
    user_id: string | null
    created_at: string
    updated_at: string
    organization_id: string
    design_session_id: string
    building_schema_version_id: string | null
  }>
  buildingSchemaId: string
  latestVersionNumber?: number
}

type Props = {
  designSession: DesignSession
  initialSchema: Schema
}

export const SessionDetailPage: FC<Props> = ({
  designSession,
  initialSchema,
}) => {
  return (
    <SchemaProvider
      designSessionId={designSession.id}
      initialSchema={initialSchema}
    >
      <SessionDetailContent designSession={designSession} />
    </SchemaProvider>
  )
}
