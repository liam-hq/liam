import path from 'node:path'
import {
  detectFormat,
  parse,
  type SupportedFormat,
  setPrismWasmUrl,
  supportedFormatSchema,
} from '@liam-hq/schema/parser'
import * as Sentry from '@sentry/nextjs'
import { load } from 'cheerio'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import * as v from 'valibot'
import type { PageProps } from '../../../types'
import ERDViewer from './erdViewer'
import {
  fetchSchemaFromGitHubFolder,
  isGitHubFolderUrl,
} from './utils/githubUrlHandler'

const paramsSchema = v.object({
  slug: v.array(v.string()),
})
const searchParamsSchema = v.object({
  format: v.optional(supportedFormatSchema),
})

const resolveContentUrl = (url: string): string | undefined => {
  try {
    const parsedUrl = new URL(url)

    if (parsedUrl.hostname === 'github.com' && url.includes('/blob/')) {
      return url
        .replace('github.com', 'raw.githubusercontent.com')
        .replace('/blob', '')
    }

    return url
  } catch {
    return undefined
  }
}

// Helper function to handle GitHub folder URL processing
async function handleGitHubFolderUrl(
  url: string,
  weCannotAccess: string,
  pleaseCheck: string,
) {
  const result = await fetchSchemaFromGitHubFolder(url)

  if (result.isOk()) {
    return {
      input: result.value.content,
      detectedFormatFromFiles: result.value.detectedFormat,
      errors: [],
    }
  }

  return {
    input: null,
    detectedFormatFromFiles: undefined,
    errors: [
      {
        name: 'NetworkError' as const,
        message: `${result.error.name}: ${result.error.message}. ${weCannotAccess}`,
        instruction: pleaseCheck,
      },
    ],
  }
}

// Helper function to handle single file URL processing
async function handleSingleFileUrl(
  url: string,
  weCannotAccess: string,
  pleaseCheck: string,
) {
  const contentUrl = resolveContentUrl(url)
  if (!contentUrl) {
    return {
      input: null,
      detectedFormatFromFiles: undefined,
      errors: [
        {
          name: 'NetworkError' as const,
          message: weCannotAccess,
          instruction: pleaseCheck,
        },
      ],
    }
  }

  const networkErrorObjects: Array<{
    name: 'NetworkError'
    message: string
    instruction?: string
  }> = []

  const res = await fetch(contentUrl, { cache: 'no-store' }).catch((e) => {
    if (e instanceof Error) {
      networkErrorObjects.push({
        name: 'NetworkError',
        message: `${e.name}: ${e.message}. ${weCannotAccess}`,
        instruction: pleaseCheck,
      })
    } else {
      networkErrorObjects.push({
        name: 'NetworkError',
        message: `Unknown NetworkError. ${weCannotAccess}`,
        instruction: pleaseCheck,
      })
    }
    return null
  })

  const input = res ? await res.text() : null
  return {
    input,
    detectedFormatFromFiles: undefined,
    errors: networkErrorObjects,
  }
}

// Helper function to determine schema format
async function determineSchemaFormat(
  url: string,
  detectedFormatFromFiles: string | undefined,
  searchParams: unknown,
): Promise<SupportedFormat | undefined> {
  let format: SupportedFormat | undefined

  // Check search params first
  if (v.is(searchParamsSchema, searchParams)) {
    format = searchParams.format
  }

  // If not specified, try to detect format
  if (format === undefined) {
    if (
      isGitHubFolderUrl(url) &&
      detectedFormatFromFiles &&
      v.is(supportedFormatSchema, detectedFormatFromFiles)
    ) {
      format = detectedFormatFromFiles
    } else {
      const contentUrl = resolveContentUrl(url)
      if (contentUrl) {
        format = detectFormat(contentUrl)
      }
    }
  }

  return format
}

// Helper function to render error view
function renderErrorView(
  blankSchema: {
    tables: Record<string, never>
    enums: Record<string, never>
    extensions: Record<string, never>
  },
  errors: Array<{ name: string; message: string; instruction?: string }>,
  fallbackMessage: string,
  fallbackInstruction: string,
) {
  return (
    <ERDViewer
      schema={blankSchema}
      defaultSidebarOpen={false}
      errorObjects={
        errors.length > 0
          ? errors
          : [
              {
                name: 'NetworkError',
                message: fallbackMessage,
                instruction: fallbackInstruction,
              },
            ]
      }
    />
  )
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) notFound()

  const joinedPath = parsedParams.output.slug.join('/')

  const projectUrl = `https://${joinedPath}`

  const res = await fetch(projectUrl).catch(() => null)

  const projectName = await (async () => {
    if (res?.ok) {
      const html = await res.text()
      const $ = load(html)
      const ogTitle = $('meta[property="og:title"]').attr('content')
      const htmlTitle = $('title').text()
      return ogTitle || htmlTitle || joinedPath
    }
    return joinedPath
  })()

  const metaTitle = `${projectName} - Liam ERD`
  const metaDescription =
    'Generate ER diagrams effortlessly by entering a schema file URL. Ideal for visualizing, reviewing, and documenting schemas.'

  const imageUrl = '/assets/liam_erd.png'

  return {
    title: metaTitle,
    description: metaDescription,
    openGraph: {
      url: `https://liambx.com/erd/p/${joinedPath}`,
      images: imageUrl,
    },
  }
}

export default async function Page({
  params,
  searchParams: _searchParams,
}: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) notFound()

  const joinedPath = parsedParams.output.slug.join('/')
  const url = `https://${joinedPath}`
  const blankSchema = { tables: {}, enums: {}, extensions: {} }
  const weCannotAccess = `Our signal's lost in the void! No access at this time..`
  const pleaseCheck = `Double-check the transmission link ${url} and initiate contact again.`

  // Process URL to get content
  const result = isGitHubFolderUrl(url)
    ? await handleGitHubFolderUrl(url, weCannotAccess, pleaseCheck)
    : await handleSingleFileUrl(url, weCannotAccess, pleaseCheck)

  // Handle errors or missing input
  if (!result.input || result.errors.length > 0) {
    return renderErrorView(
      blankSchema,
      result.errors,
      weCannotAccess,
      pleaseCheck,
    )
  }

  setPrismWasmUrl(path.resolve(process.cwd(), 'prism.wasm'))

  // Determine schema format
  const searchParams = await _searchParams
  const format = await determineSchemaFormat(
    url,
    result.detectedFormatFromFiles,
    searchParams,
  )

  if (format === undefined) {
    // Strictly speaking, this is not always a network error, but the error name is temporarily set as "NetworkError" for display purposes.
    // TODO: Update the error name to something more appropriate.
    return renderErrorView(
      blankSchema,
      [],
      weCannotAccess,
      'Please specify the format in the URL query parameter `format`',
    )
  }

  // Parse schema and prepare for rendering

  const { value: schema, errors } = await parse(result.input, format)

  for (const error of errors) {
    Sentry.captureException(error)
  }

  const errorObjects = errors.map((error: Error) => ({
    name: error.name,
    message: error.message,
  }))

  const cookieStore = await cookies()
  const defaultSidebarOpen = cookieStore.get('sidebar:state')?.value === 'true'
  const layoutCookie = cookieStore.get('panels:layout')
  const defaultPanelSizes = (() => {
    if (!layoutCookie) return [20, 80]
    try {
      const sizes = JSON.parse(layoutCookie.value)
      if (Array.isArray(sizes) && sizes.length >= 2) {
        return sizes
      }
    } catch {
      // Use default values if JSON.parse fails
    }
    return [20, 80]
  })()

  return (
    <ERDViewer
      schema={schema}
      defaultSidebarOpen={defaultSidebarOpen}
      defaultPanelSizes={defaultPanelSizes}
      errorObjects={errorObjects}
    />
  )
}
