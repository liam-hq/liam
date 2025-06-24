import { schemaOverrideSchema } from '@liam-hq/db-structure'
import { createOrUpdateFileContent, getFileContent } from '@liam-hq/github'
import { type NextRequest, NextResponse } from 'next/server'
import * as v from 'valibot'
import { parse as parseYaml } from 'yaml'
import { SCHEMA_OVERRIDE_FILE_PATH } from '@/features/schemas/constants'
import { createClient } from '@/libs/db/server'

const requestParamsSchema = v.object({
  projectId: v.string(),
  branchOrCommit: v.string(),
})

export async function POST(request: NextRequest) {
  try {
    const requestParams = await request.json()
    const parsedRequestParams = v.safeParse(requestParamsSchema, requestParams)

    if (!parsedRequestParams.success) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 },
      )
    }

    const { projectId, branchOrCommit } = parsedRequestParams.output

    const supabase = await createClient()
    const { data: project } = await supabase
      .from('projects')
      .select(`
        *,
        project_repository_mappings(
          *,
          github_repositories(
            name, owner, github_installation_identifier
          )
        )
      `)
      .eq('id', projectId)
      .single()

    const repository =
      project?.project_repository_mappings[0].github_repositories
    if (
      !repository?.github_installation_identifier ||
      !repository.owner ||
      !repository.name
    ) {
      return NextResponse.json(
        { error: 'Repository information not found' },
        { status: 404 },
      )
    }

    const repositoryFullName = `${repository.owner}/${repository.name}`
    const { content, sha } = await getFileContent(
      repositoryFullName,
      SCHEMA_OVERRIDE_FILE_PATH,
      branchOrCommit,
      Number(repository.github_installation_identifier),
    )

    const rawSchemaOverride = content ? parseYaml(content) : { overrides: {} }

    const validationResult = v.safeParse(
      schemaOverrideSchema,
      rawSchemaOverride,
    )

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Failed to validate schema override file' },
        { status: 500 },
      )
    }

    const schemaOverride = validationResult.output

    const { success } = await createOrUpdateFileContent(
      repositoryFullName,
      SCHEMA_OVERRIDE_FILE_PATH,
      JSON.stringify(schemaOverride, null, 2),
      `Update ${SCHEMA_OVERRIDE_FILE_PATH}`,
      Number(repository.github_installation_identifier),
      branchOrCommit,
      sha || undefined,
    )

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update schema override' },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error creating group:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
