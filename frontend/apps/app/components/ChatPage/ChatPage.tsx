import path from 'node:path'
import { getOrganizationId } from '@/features/organizations/services/getOrganizationId'
import { adaptSchemaForChatbot } from '@/features/schemas/components/Chatbot/utils'
import type { ERDEditor } from '@/features/schemas/pages/SchemaPage/components/ERDEditor'
import { safeApplySchemaOverride } from '@/features/schemas/pages/SchemaPage/utils/safeApplySchemaOverride'
import { createClient } from '@/libs/db/server'
import { parse, setPrismWasmUrl } from '@liam-hq/db-structure/parser'
import { getFileContent } from '@liam-hq/github'
import * as Sentry from '@sentry/nextjs'
import { cookies } from 'next/headers'
import type { ComponentProps, FC } from 'react'
import { Chat } from './Chat'
import { getSchemaFilePath } from './services/getSchemaFilePath'

type Params = {
  organizationId: string
  projectId: string
  branchOrCommit: string
}

type Response = ComponentProps<typeof ERDEditor>

async function getERDEditorContent({
  organizationId,
  projectId,
  branchOrCommit,
}: Params): Promise<Response> {
  const blankSchema = { tables: {}, relationships: {}, tableGroups: {} }
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

  const { data: schamaFilePath } = await getSchemaFilePath({
    projectId,
    organizationId,
  })
  if (!schamaFilePath) {
    return {
      schema: blankSchema,
      defaultSidebarOpen: false,
      errorObjects: [
        {
          name: 'FileNotFound',
          message: 'The specified file could not be found in the repository.',
          instruction:
            'Please check the file path and branch/commit reference.',
        },
      ],
    }
  }

  const repository = project?.project_repository_mappings[0].github_repositories
  if (
    !repository?.github_installation_identifier ||
    !repository.owner ||
    !repository.name
  ) {
    console.error('Repository information not found')
    throw new Error('Repository information not found')
  }

  const repositoryFullName = `${repository.owner}/${repository.name}`
  const { content } = await getFileContent(
    repositoryFullName,
    schamaFilePath.path,
    branchOrCommit,
    repository.github_installation_identifier,
  )

  if (!content) {
    return {
      schema: blankSchema,
      defaultSidebarOpen: false,
      errorObjects: [
        {
          name: 'FileNotFound',
          message: 'The specified file could not be found in the repository.',
          instruction:
            'Please check the file path and branch/commit reference.',
        },
      ],
    }
  }

  setPrismWasmUrl(path.resolve(process.cwd(), 'prism.wasm'))

  const format = schamaFilePath.format
  const { value: schema, errors } = await parse(content, format)

  for (const error of errors) {
    Sentry.captureException(error)
  }

  const { result, error: overrideError } = await safeApplySchemaOverride(
    repositoryFullName,
    branchOrCommit,
    repository.github_installation_identifier,
    schema,
  )

  if (overrideError) {
    return {
      schema: blankSchema,
      defaultSidebarOpen: false,
      errorObjects: [overrideError],
    }
  }

  const { schema: overriddenSchema, tableGroups } = result || {
    schema,
    tableGroups: {},
  }
  const cookieStore = await cookies()
  const defaultSidebarOpen = cookieStore.get('sidebar:state')?.value === 'true'
  const layoutCookie = cookieStore.get('panels:layout')
  const defaultPanelSizes = (() => {
    if (!layoutCookie) return [20, 80]
    try {
      const sizes = JSON.parse(layoutCookie.value)
      if (Array.isArray(sizes) && sizes.length >= 2) return sizes
    } catch {}
    return [20, 80]
  })()

  return {
    schema: overriddenSchema,
    tableGroups,
    defaultSidebarOpen,
    defaultPanelSizes,
    errorObjects: errors.map((error) => ({
      name: error.name,
      message: error.message,
    })),
    projectId,
    branchOrCommit,
  }
}

type Props = {
  projectId: string
  branchOrCommit: string
}

export const ChatPage: FC<Props> = async ({ projectId, branchOrCommit }) => {
  const organizationId = await getOrganizationId()

  if (organizationId == null) {
    return null
  }

  const { schema, tableGroups } = await getERDEditorContent({
    organizationId,
    projectId,
    branchOrCommit,
  })

  const adaptedSchema = adaptSchemaForChatbot(schema)

  return <Chat schemaData={adaptedSchema} tableGroups={tableGroups} />
}
