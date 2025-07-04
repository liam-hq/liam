import path from 'node:path'
import {
  detectFormat,
  parse,
  type SupportedFormat,
  setPrismWasmUrl,
  supportedFormatSchema,
} from '@liam-hq/db-structure'
import * as Sentry from '@sentry/nextjs'
import { load } from 'cheerio'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import * as v from 'valibot'
import type { PageProps } from '@/app/types'
import ERDViewer from './erdViewer'

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

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) throw new Error('Invalid parameters')

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
  if (!parsedParams.success) throw new Error('Invalid parameters')

  const joinedPath = parsedParams.output.slug.join('/')

  const url = `https://${joinedPath}`

  const blankSchema = { tables: {} }

  const contentUrl = resolveContentUrl(url)
  const weCannotAccess = `Our signal's lost in the void! No access at this time..`
  const pleaseCheck = `Double-check the transmission link ${url} and initiate contact again.`
  if (!contentUrl) {
    return (
      <ERDViewer
        schema={blankSchema}
        defaultSidebarOpen={false}
        errorObjects={[
          {
            name: 'NetworkError',
            message: weCannotAccess,
            instruction: pleaseCheck,
          },
        ]}
      />
    )
  }
  const networkErrorObjects: {
    name: 'NetworkError'
    message: string
    instruction?: string
  }[] = []
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
  })
  if (!res && networkErrorObjects.length === 0)
    networkErrorObjects.push({
      name: 'NetworkError',
      message: `Unknown error. ${pleaseCheck}.`,
      instruction: pleaseCheck,
    })
  if (!res || networkErrorObjects.length > 0) {
    return (
      <ERDViewer
        schema={blankSchema}
        defaultSidebarOpen={false}
        errorObjects={networkErrorObjects}
      />
    )
  }
  if (!res.ok) {
    return (
      <ERDViewer
        schema={blankSchema}
        defaultSidebarOpen={false}
        errorObjects={[
          {
            name: 'NetworkError',
            message: `HTTP status is ${res.status}: ${res.statusText}.`,
            instruction: pleaseCheck,
          },
        ]}
      />
    )
  }

  const input = await res.text()

  setPrismWasmUrl(path.resolve(process.cwd(), 'prism.wasm'))

  let format: SupportedFormat | undefined
  const searchParams = await _searchParams
  if (v.is(searchParamsSchema, searchParams)) {
    format = searchParams.format
  }
  if (format === undefined) {
    format = detectFormat(contentUrl)
  }
  if (format === undefined) {
    // Strictly speaking, this is not always a network error, but the error name is temporarily set as "NetworkError" for display purposes.
    // TODO: Update the error name to something more appropriate.
    return (
      <ERDViewer
        schema={blankSchema}
        defaultSidebarOpen={false}
        errorObjects={[
          {
            name: 'NetworkError',
            message: weCannotAccess,
            instruction:
              'Please specify the format in the URL query parameter `format`',
          },
        ]}
      />
    )
  }

  const { value: schema, errors } = await parse(input, format)
  for (const error of errors) {
    Sentry.captureException(error)
  }
  const errorObjects = errors.map((error) => ({
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
