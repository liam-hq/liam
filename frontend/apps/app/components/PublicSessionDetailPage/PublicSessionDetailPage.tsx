import { type Artifact, artifactSchema } from '@liam-hq/artifact'
import { schemaSchema } from '@liam-hq/schema'
import { notFound } from 'next/navigation'
import type { ReactElement } from 'react'
import { safeParse } from 'valibot'
import { createPublicServerClient } from '../../libs/db/server'
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

  const { data: artifactData, error } = await supabase
    .from('artifacts') // Explicitly specify columns as anon user has grants on individual columns, not all columns
    .select('id, design_session_id, artifact, created_at, updated_at')
    .eq('design_session_id', designSessionId)
    .maybeSingle()

  if (error) {
    // Degrade gracefully: continue without artifact
    // Optionally log error server-side if desired
  }
  let initialArtifact: Artifact | null = null
  const parsedArtifact = safeParse(artifactSchema, artifactData?.artifact)
  if (parsedArtifact.success) {
    initialArtifact = parsedArtifact.output
  }

  return (
    <PublicLayout>
      <ViewModeProvider mode="public">
        <SessionDetailPageClient
          buildingSchemaId={buildingSchemaId}
          designSessionId={designSessionId}
          initialMessages={[]}
          initialAnalyzedRequirements={null}
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
          isDeepModelingEnabled={false}
          initialIsPublic={true}
          initialArtifact={initialArtifact}
          senderName="Guest"
        />
      </ViewModeProvider>
    </PublicLayout>
  )
}
