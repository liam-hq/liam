import { schemaSchema } from '@liam-hq/schema'
import { notFound } from 'next/navigation'
import type { ReactElement } from 'react'
import { safeParse } from 'valibot'
import { createPublicServerClient } from '@/libs/db/server'
import { PublicLayout } from '../PublicLayout'
import { ViewModeProvider } from '../SessionDetailPage/contexts/ViewModeContext'
import { SessionDetailPageClient } from '../SessionDetailPage/SessionDetailPageClient'
import { buildPrevSchema } from '../SessionDetailPage/services/buildPrevSchema/server/buildPrevSchema'

type Props = {
  designSessionId: string
}

export const PublicSessionDetailPage = async ({
  designSessionId,
}: Props): Promise<ReactElement> => {
  // Use public client for all anonymous access
  const supabase = await createPublicServerClient()

  // First check if the session is publicly shared
  const { data: publicShareData } = await supabase
    .from('public_share_settings')
    .select('design_session_id')
    .eq('design_session_id', designSessionId)
    .single()

  if (!publicShareData) {
    notFound()
  }

  // Fetch design session data directly from tables
  const { data: designSession, error: sessionError } = await supabase
    .from('design_sessions')
    .select('id, name, created_at, parent_design_session_id')
    .eq('id', designSessionId)
    .single()

  if (sessionError || !designSession) {
    notFound()
  }

  // Fetch timeline items
  const { data: timelineItems } = await supabase
    .from('timeline_items')
    .select(
      'id, design_session_id, content, created_at, updated_at, building_schema_version_id, type, query_result_id, assistant_role',
    )
    .eq('design_session_id', designSessionId)
    .order('created_at', { ascending: true })

  // Fetch building schema
  const { data: buildingSchemas } = await supabase
    .from('building_schemas')
    .select(
      'id, design_session_id, schema, created_at, git_sha, initial_schema_snapshot, schema_file_path',
    )
    .eq('design_session_id', designSessionId)

  if (!buildingSchemas || buildingSchemas.length === 0) {
    notFound()
  }

  const buildingSchema = buildingSchemas[0]
  if (!buildingSchema || !buildingSchema.id) {
    notFound()
  }
  const buildingSchemaId = buildingSchema.id

  // Fetch versions
  const { data: versions } = await supabase
    .from('building_schema_versions')
    .select('id, building_schema_id, number, created_at, patch, reverse_patch')
    .eq('building_schema_id', buildingSchemaId)
    .order('number', { ascending: false })

  if (!versions || versions.length === 0) {
    notFound()
  }

  // Parse schema
  const parsedSchema = safeParse(schemaSchema, buildingSchema.schema)
  if (!parsedSchema.success) {
    notFound()
  }
  const initialSchema = parsedSchema.output

  // Get latest version for prev schema
  const latestVersion = versions[0]
  if (!latestVersion || !latestVersion.id || latestVersion.number === null) {
    notFound()
  }

  const initialPrevSchema =
    (await buildPrevSchema({
      currentSchema: initialSchema,
      currentVersionId: latestVersion.id,
    })) ?? initialSchema

  // Add required fields for timeline items and design session
  const designSessionWithTimelineItems = {
    id: designSession.id ?? '',
    organization_id: 'public', // Dummy value for public access
    timeline_items: (timelineItems || []).map((item) => ({
      ...item,
      id: item.id ?? '',
      content: item.content ?? '',
      type: item.type ?? 'user',
      created_at: item.created_at ?? new Date().toISOString(),
      design_session_id: item.design_session_id ?? designSessionId,
      organization_id: 'public', // Dummy value for public access
      user_id: null, // Public access doesn't have user info
      updated_at: item.updated_at ?? new Date().toISOString(),
    })),
  }

  return (
    <PublicLayout>
      <ViewModeProvider mode="public">
        <SessionDetailPageClient
          buildingSchemaId={buildingSchemaId}
          designSessionWithTimelineItems={designSessionWithTimelineItems}
          initialDisplayedSchema={initialSchema}
          initialPrevSchema={initialPrevSchema}
          initialVersions={versions
            .filter(
              (
                v,
              ): v is NonNullable<typeof v> & {
                id: string
                number: number
                created_at: string
              } => v.id !== null && v.number !== null && v.created_at !== null,
            )
            .map((v) => ({
              id: v.id,
              number: v.number,
              created_at: v.created_at,
              building_schema_id: v.building_schema_id ?? '',
              patch: v.patch ?? {},
              reverse_patch: v.reverse_patch ?? {},
            }))}
          initialWorkflowRunStatus={null}
          isDeepModelingEnabled={false}
          initialIsPublic={true}
        />
      </ViewModeProvider>
    </PublicLayout>
  )
}
