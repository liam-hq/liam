import {
  createSupabaseRepositories,
  getAnalyzedRequirements,
} from '@liam-hq/agent'
import { schemaSchema } from '@liam-hq/schema'
import { notFound } from 'next/navigation'
import type { ReactElement } from 'react'
import { safeParse } from 'valibot'
import { createPublicServerClient } from '../../libs/db/server'
import { PublicLayout } from '../PublicLayout'
import { DEFAULT_PANEL_SIZES } from '../SessionDetailPage/constants'
import { ViewModeProvider } from '../SessionDetailPage/contexts/ViewModeContext'
import { SessionDetailPageClient } from '../SessionDetailPage/SessionDetailPageClient'

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

  // Fetch building schema
  const { data: buildingSchemas } = await supabase
    .from('building_schemas')
    .select(
      'id, design_session_id, organization_id, schema, created_at, git_sha, initial_schema_snapshot, schema_file_path',
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

  const parsedBaselineSchema = safeParse(
    schemaSchema,
    buildingSchema.initial_schema_snapshot,
  )
  if (!parsedBaselineSchema.success) {
    notFound()
  }
  const baselineSchema = parsedBaselineSchema.output

  const organizationId = buildingSchema.organization_id

  const repositories = createSupabaseRepositories(supabase, organizationId)
  const config = {
    configurable: {
      repositories,
      thread_id: designSessionId,
    },
  }
  const initialAnalyzedRequirements = await getAnalyzedRequirements(config)

  return (
    <PublicLayout>
      <ViewModeProvider mode="public">
        <SessionDetailPageClient
          buildingSchemaId={buildingSchemaId}
          designSessionId={designSessionId}
          initialMessages={[]}
          initialAnalyzedRequirements={initialAnalyzedRequirements}
          initialDisplayedSchema={initialSchema}
          baselineSchema={baselineSchema}
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
          initialIsPublic={true}
          panelSizes={DEFAULT_PANEL_SIZES}
        />
      </ViewModeProvider>
    </PublicLayout>
  )
}
