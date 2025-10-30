import type { BaseMessage, StoredMessage } from '@langchain/core/messages'
import type { AnalyzedRequirements } from '@liam-hq/agent'
import {
  createSupabaseRepositories,
  getAnalyzedRequirements,
  getCheckpointErrors,
  getMessages,
} from '@liam-hq/agent'
import type { Schema } from '@liam-hq/schema'
import { schemaSchema } from '@liam-hq/schema'
import { err, ok, type Result } from 'neverthrow'
import { cookies } from 'next/headers'
import { type FC, Suspense } from 'react'
import { safeParse } from 'valibot'
import { checkPublicShareStatus } from '../../features/public-share/actions'
import { createClient } from '../../libs/db/server'
import { Fallback } from './components/Fallback'
import { DEFAULT_PANEL_SIZES, PANEL_LAYOUT_COOKIE_NAME } from './constants'
import { ViewModeProvider } from './contexts/ViewModeContext'
import { SessionDetailPageClient } from './SessionDetailPageClient'
import { getBuildingSchema } from './services/buildingSchema/server/getBuildingSchema'
import { getVersions } from './services/getVersions'

// NOTE: Server Components can only pass plain objects to Client Components, not class instances
// BaseMessage[] must be serialized to StoredMessage[] for the component boundary
const serializeMessages = (messages: BaseMessage[]): StoredMessage[] => {
  return messages.map((message) => message.toDict())
}

async function loadSessionData(designSessionId: string): Promise<
  Result<
    {
      messages: StoredMessage[]
      buildingSchema: NonNullable<Awaited<ReturnType<typeof getBuildingSchema>>>
      initialSchema: Schema
      baselineSchema: Schema
      initialAnalyzedRequirements: AnalyzedRequirements | null
      workflowError: string | null
    },
    Error
  >
> {
  const buildingSchema = await getBuildingSchema(designSessionId)
  if (!buildingSchema) {
    return err(new Error('Building schema not found for design session'))
  }

  const supabase = await createClient()
  const organizationId = buildingSchema.organization_id
  const repositories = createSupabaseRepositories(supabase, organizationId)
  const config = {
    configurable: {
      repositories,
      thread_id: designSessionId,
    },
  }
  const baseMessages = await getMessages(config)
  const messages = serializeMessages(baseMessages)
  const initialAnalyzedRequirements = await getAnalyzedRequirements(config)

  // Fetch checkpoint error from LangGraph memory
  const checkpointErrors = await getCheckpointErrors(
    repositories.schema.checkpointer,
    designSessionId,
  )
  const workflowError = checkpointErrors[0] || null

  const parsedSchema = safeParse(schemaSchema, buildingSchema.schema)
  const initialSchema = parsedSchema.success ? parsedSchema.output : null

  if (!initialSchema) {
    return err(new Error('Invalid schema format'))
  }

  const parsedBaselineSchema = safeParse(
    schemaSchema,
    buildingSchema.initial_schema_snapshot,
  )
  if (!parsedBaselineSchema.success) {
    return err(new Error('Invalid schema format'))
  }
  const baselineSchema = parsedBaselineSchema.output

  return ok({
    messages,
    buildingSchema,
    initialSchema,
    baselineSchema,
    initialAnalyzedRequirements,
    workflowError,
  })
}

type InnerProps = Props & {
  panelSizes: number[]
}

const SessionDetailPageInner: FC<InnerProps> = async ({
  designSessionId,
  panelSizes,
}) => {
  const result = await loadSessionData(designSessionId)

  if (result.isErr()) {
    throw result.error
  }

  const {
    messages,
    buildingSchema,
    initialSchema,
    baselineSchema,
    workflowError,
    initialAnalyzedRequirements,
  } = result.value

  const versions = await getVersions(buildingSchema.id)

  // Fetch initial public share status
  const { isPublic: initialIsPublic } =
    await checkPublicShareStatus(designSessionId)

  return (
    <SessionDetailPageClient
      buildingSchemaId={buildingSchema.id}
      designSessionId={designSessionId}
      initialMessages={messages}
      initialAnalyzedRequirements={initialAnalyzedRequirements}
      initialDisplayedSchema={initialSchema}
      baselineSchema={baselineSchema}
      initialVersions={versions}
      initialIsPublic={initialIsPublic}
      initialWorkflowError={workflowError}
      panelSizes={panelSizes}
    />
  )
}

type Props = {
  designSessionId: string
}

export const SessionDetailPage: FC<Props> = async ({ designSessionId }) => {
  const cookieStore = await cookies()
  const layoutCookie = cookieStore.get(PANEL_LAYOUT_COOKIE_NAME)
  const panelSizes = (() => {
    if (!layoutCookie) return DEFAULT_PANEL_SIZES
    try {
      const sizes = JSON.parse(layoutCookie.value)
      if (Array.isArray(sizes) && sizes.length >= 2) return sizes
    } catch {}
    return DEFAULT_PANEL_SIZES
  })()

  return (
    <Suspense fallback={<Fallback panelSizes={panelSizes} />}>
      <ViewModeProvider mode="private">
        <SessionDetailPageInner
          designSessionId={designSessionId}
          panelSizes={panelSizes}
        />
      </ViewModeProvider>
    </Suspense>
  )
}
