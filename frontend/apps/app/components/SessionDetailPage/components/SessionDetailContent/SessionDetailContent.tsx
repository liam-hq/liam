import { Chat } from '@/components/Chat'
import type { FC } from 'react'
import { Artifact } from '../Artifact'
import styles from './SessionDetailContent.module.css'

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
}

export const SessionDetailContent: FC<Props> = ({ designSession }) => {
  return (
    <div className={styles.container}>
      <div className={styles.columns}>
        <div className={styles.chatSection}>
          <Chat designSession={designSession} />
        </div>
        <Artifact />
      </div>
    </div>
  )
}
