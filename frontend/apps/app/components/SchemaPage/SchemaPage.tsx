import path from 'node:path'
import { parse, setPrismWasmUrl } from '@liam-hq/db-structure/parser'
import { getFileContent } from '@liam-hq/github'
import * as Sentry from '@sentry/nextjs'
import { cookies } from 'next/headers'
import type { ComponentProps, FC } from 'react'
import { TabsContent, TabsRoot } from '@/components'
import { createClient } from '@/libs/db/server'
import { ERDEditor } from './components/ERDEditor'
import { SchemaHeader } from './components/SchemaHeader'
import { DEFAULT_SCHEMA_TAB, SCHEMA_TAB } from './constants'
import styles from './SchemaPage.module.css'

type Params = {
  projectId: string
  branchOrCommit: string
  schemaFilePath: string
}

type Response = ComponentProps<typeof ERDEditor>

async function getERDEditorContent({
  projectId,
  branchOrCommit,
  schemaFilePath,
}: Params): Promise<Response> {
  const blankSchema = { tables: {}, relationships: {} }
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

  const { data: gitHubSchemaFilePath } = await supabase
    .from('schema_file_paths')
    .select('path, format')
    .eq('project_id', projectId)
    .eq('path', schemaFilePath)
    .single()

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
    schemaFilePath,
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

  if (!gitHubSchemaFilePath?.format) {
    return {
      schema: blankSchema,
      defaultSidebarOpen: false,
      errorObjects: [
        {
          name: 'FormatError',
          message: 'Record not found',
          instruction: 'Please make sure that the schema file exists.',
        },
      ],
    }
  }

  const format = gitHubSchemaFilePath.format
  const { value: schema, errors } = await parse(content, format)

  for (const error of errors) {
    Sentry.captureException(error)
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
    schema,
    defaultSidebarOpen,
    defaultPanelSizes,
    errorObjects: errors.map((error) => ({
      name: error.name,
      message: error.message,
    })),
  }
}

type Props = {
  projectId: string
  branchOrCommit: string
  schemaFilePath: string
}

export const SchemaPage: FC<Props> = async ({
  projectId,
  branchOrCommit,
  schemaFilePath,
}) => {
  const contentProps = await getERDEditorContent({
    projectId,
    branchOrCommit,
    schemaFilePath,
  })

  return (
    <TabsRoot defaultValue={DEFAULT_SCHEMA_TAB} className={styles.wrapper}>
      <SchemaHeader />
      <TabsContent value={SCHEMA_TAB.ERD} className={styles.tabsContent}>
        <ERDEditor {...contentProps} />
      </TabsContent>
    </TabsRoot>
  )
}
