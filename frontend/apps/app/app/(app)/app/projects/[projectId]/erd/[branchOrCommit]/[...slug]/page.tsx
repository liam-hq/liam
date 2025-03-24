import path from 'node:path'
import type { PageProps } from '@/app/types'
import { getFileContent, getRepository } from '@/libs/github/api.server'
import { prisma } from '@liam-hq/db'
import {
  type SupportedFormat,
  detectFormat,
  parse,
  setPrismWasmUrl,
  supportedFormatSchema,
} from '@liam-hq/db-structure/parser'
import * as Sentry from '@sentry/nextjs'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import * as v from 'valibot'
import ERDViewer from './erdViewer'

const paramsSchema = v.object({
  projectId: v.string(),
  branchOrCommit: v.string(),
  slug: v.array(v.string()),
})

const searchParamsSchema = v.object({
  format: v.optional(supportedFormatSchema),
})

export default async function Page({
  params,
  searchParams: _searchParams,
}: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) throw notFound()

  const { projectId, branchOrCommit, slug } = parsedParams.output
  const filePath = slug.join('/')

  const blankDbStructure = { tables: {}, relationships: {} }

  try {
    const project = await prisma.project.findUnique({
      where: { id: Number(projectId) },
      include: {
        repositoryMappings: {
          include: {
            repository: {
              select: { owner: true, name: true, installationId: true },
            },
          },
        },
      },
    })

    const repository = project?.repositoryMappings[0]?.repository
    if (!repository?.installationId || !repository.owner || !repository.name) {
      throw new Error('Repository information not found')
    }

    const repositoryFullName = `${repository.owner}/${repository.name}`

    const content = await getFileContent(
      repositoryFullName,
      filePath,
      branchOrCommit,
      Number(repository.installationId),
    )

    if (!content) {
      return (
        <ERDViewer
          dbStructure={blankDbStructure}
          defaultSidebarOpen={false}
          errorObjects={[
            {
              name: 'FileNotFound',
              message:
                'The specified file could not be found in the repository.',
              instruction:
                'Please check the file path and branch/commit reference.',
            },
          ]}
        />
      )
    }

    setPrismWasmUrl(path.resolve(process.cwd(), 'prism.wasm'))

    let format: SupportedFormat | undefined
    const searchParams = await _searchParams

    if (v.is(searchParamsSchema, searchParams)) {
      format = searchParams.format
    }
    if (!format) {
      format = detectFormat(filePath)
    }

    if (!format) {
      return (
        <ERDViewer
          dbStructure={blankDbStructure}
          defaultSidebarOpen={false}
          errorObjects={[
            {
              name: 'FormatError',
              message: 'Could not detect the file format.',
              instruction:
                'Please specify the format in the URL query parameter `format`',
            },
          ]}
        />
      )
    }

    const { value: dbStructure, errors } = await parse(content, format)
    for (const error of errors) {
      Sentry.captureException(error)
    }

    const cookieStore = await cookies()
    const defaultSidebarOpen =
      cookieStore.get('sidebar:state')?.value === 'true'
    const layoutCookie = cookieStore.get('panels:layout')
    const defaultPanelSizes = (() => {
      if (!layoutCookie) return [20, 80]
      try {
        const sizes = JSON.parse(layoutCookie.value)
        if (Array.isArray(sizes) && sizes.length >= 2) return sizes
      } catch {}
      return [20, 80]
    })()

    return (
      <ERDViewer
        dbStructure={dbStructure}
        defaultSidebarOpen={defaultSidebarOpen}
        defaultPanelSizes={defaultPanelSizes}
        errorObjects={errors.map((error) => ({
          name: error.name,
          message: error.message,
        }))}
      />
    )
  } catch (_error) {
    return (
      <ERDViewer
        dbStructure={blankDbStructure}
        defaultSidebarOpen={false}
        errorObjects={[
          {
            name: 'GitHubError',
            message: 'Failed to fetch file content from GitHub',
            instruction:
              'Please check your repository permissions and try again.',
          },
        ]}
      />
    )
  }
}
