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
import type { FC } from 'react'
import { safeParse } from 'valibot'
import { checkPublicShareStatus } from '../../features/public-share/actions'
import { createClient } from '../../libs/db/server'
import { DEFAULT_PANEL_SIZES, PANEL_LAYOUT_COOKIE_NAME } from './constants'
import { ViewModeProvider } from './contexts/ViewModeContext'
import { SessionDetailPageClient } from './SessionDetailPageClient'
import { getBuildingSchema } from './services/buildingSchema/server/getBuildingSchema'
import { buildPrevSchema } from './services/buildPrevSchema/server/buildPrevSchema'
import { getVersions } from './services/getVersions'
import type { Version } from './types'

type Props = {
  designSessionId: string
}

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
      initialAnalyzedRequirements: AnalyzedRequirements | null
      workflowError: string | null
      senderName: string
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

  const { data: userData } = await supabase.auth.getUser()
  const userId = userData?.user?.id

  const senderName = await (async () => {
    if (!userId) return 'User'

    const { data: userInfo } = await supabase
      .from('users')
      .select('name')
      .eq('id', userId)
      .single()

    return userInfo?.name || 'User'
  })()

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

  return ok({
    messages,
    buildingSchema,
    initialSchema,
    initialAnalyzedRequirements,
    workflowError,
    senderName,
  })
}

export const SessionDetailPage: FC<Props> = async ({ designSessionId }) => {
  const result = await loadSessionData(designSessionId)

  if (result.isErr()) {
    throw result.error
  }

  const {
    messages,
    buildingSchema,
    initialSchema,
    workflowError,
    initialAnalyzedRequirements,
    senderName,
  } = result.value

  const versions = await getVersions(buildingSchema.id)
  const latestVersion: Version | undefined = versions[0]
  const initialPrevSchema = latestVersion
    ? ((await buildPrevSchema({
        currentSchema: initialSchema,
        currentVersionId: latestVersion.id,
      })) ?? initialSchema)
    : initialSchema

  // Fetch initial public share status
  const { isPublic: initialIsPublic } =
    await checkPublicShareStatus(designSessionId)

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
    <ViewModeProvider mode="private">
      <SessionDetailPageClient
        buildingSchemaId={buildingSchema.id}
        designSessionId={designSessionId}
        initialMessages={messages}
        initialAnalyzedRequirements={initialAnalyzedRequirements}
        initialDisplayedSchema={initialSchema}
        initialPrevSchema={initialPrevSchema}
        initialVersions={versions}
        initialIsPublic={initialIsPublic}
        initialWorkflowError={workflowError}
        senderName={senderName}
        panelSizes={panelSizes}
      />
    </ViewModeProvider>
  )
}
