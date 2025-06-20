'use client'

import { type Schema, schemaSchema } from '@liam-hq/db-structure'
import {
  type ComponentProps,
  type FC,
  useCallback,
  useState,
  useTransition,
} from 'react'
import { safeParse } from 'valibot'
import { Chat } from '../Chat'
import { Output } from './components/Output'
import { useRealtimeBuildlingSchema } from './hooks/useRealtimeBuildlingSchema'
import {
  ARTIFACT_DOC,
  SCHEMA_UPDATES_DOC,
  SCHEMA_UPDATES_REVIEW_COMMENTS,
} from './mock'
import styles from './SessionDetailPage.module.css'
import { getBuildingSchema } from './services/buildingSchema/client/getBuldingSchema'
import { getLatestVersion } from './services/latestVersion/client/getLatestVersion'
import type { Version } from './types'

type Props = {
  designSession: ComponentProps<typeof Chat>['designSession']
  initialSchema: Schema | null
  initialCurrentVersion: Version | null
}

export const SessionDetailPageClient: FC<Props> = ({
  designSession,
  initialSchema,
  initialCurrentVersion,
}) => {
  const designSessionId = designSession.id

  const [currentSchema, setCurrentSchema] = useState<Schema | null>(
    initialSchema,
  )
  const [, setCurrentVersion] = useState<Version | null>(initialCurrentVersion)
  const [, setQuickFixMessage] = useState<string>('')

  const handleQuickFix = useCallback((comment: string) => {
    const fixMessage = `Please fix the following issue pointed out by the QA Agent:

"${comment}"

Please suggest a specific solution to resolve this problem.`
    setQuickFixMessage(fixMessage)
  }, [])

  const [isRefetching, startTransition] = useTransition()
  const refetchSchemaAndVersion = useCallback(async () => {
    startTransition(async () => {
      const buildingSchema = await getBuildingSchema(designSessionId)
      const parsedSchema = safeParse(schemaSchema, buildingSchema?.schema)
      setCurrentSchema(parsedSchema.success ? parsedSchema.output : null)

      const latestVersion = await getLatestVersion(buildingSchema?.id ?? '')
      setCurrentVersion(latestVersion)
    })
  }, [designSessionId])

  useRealtimeBuildlingSchema(designSessionId, refetchSchemaAndVersion)

  // Show loading state while schema is being fetched
  if (isRefetching) {
    return <div>Updating schema...</div>
  }

  // Show error state if no schema is available
  if (currentSchema === null) {
    return <div>Failed to load schema</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.columns}>
        <div className={styles.chatSection}>
          <Chat schemaData={currentSchema} designSession={designSession} />
        </div>
        <div className={styles.outputSection}>
          <Output
            schema={currentSchema}
            schemaUpdatesDoc={SCHEMA_UPDATES_DOC}
            schemaUpdatesReviewComments={SCHEMA_UPDATES_REVIEW_COMMENTS}
            onQuickFix={handleQuickFix}
            artifactDoc={ARTIFACT_DOC}
          />
        </div>
      </div>
    </div>
  )
}
