import type { getAnalyzedRequirements } from '@liam-hq/agent'
import type { Json } from '@liam-hq/db'
import type { Schema } from '@liam-hq/schema'
import { PublicLayout } from '../PublicLayout'
import { DEFAULT_PANEL_SIZES } from '../SessionDetailPage/constants'
import { ViewModeProvider } from '../SessionDetailPage/contexts/ViewModeContext'
import { SessionDetailPageClient } from '../SessionDetailPage/SessionDetailPageClient'

type Version = {
  id: string
  number: number
  created_at: string
  building_schema_id: string
  patch: Json
  reverse_patch: Json
}

type Props = {
  buildingSchemaId: string
  designSessionId: string
  initialSchema: Schema
  initialPrevSchema: Schema
  initialVersions: Version[]
  initialAnalyzedRequirements: Awaited<
    ReturnType<typeof getAnalyzedRequirements>
  > | null
}

export const PublicSessionDetailPageView = ({
  buildingSchemaId,
  designSessionId,
  initialSchema,
  initialPrevSchema,
  initialVersions,
  initialAnalyzedRequirements,
}: Props) => {
  return (
    <PublicLayout>
      <ViewModeProvider mode="public">
        <SessionDetailPageClient
          buildingSchemaId={buildingSchemaId}
          designSessionId={designSessionId}
          initialMessages={[]}
          initialAnalyzedRequirements={initialAnalyzedRequirements}
          initialDisplayedSchema={initialSchema}
          initialPrevSchema={initialPrevSchema}
          initialVersions={initialVersions}
          isDeepModelingEnabled={false}
          initialIsPublic={true}
          senderName="Guest"
          panelSizes={DEFAULT_PANEL_SIZES}
        />
      </ViewModeProvider>
    </PublicLayout>
  )
}
