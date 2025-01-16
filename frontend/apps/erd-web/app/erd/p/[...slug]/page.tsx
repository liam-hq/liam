import path from 'node:path'
import type { PageProps } from '@/app/types'
import {
  type SupportedFormat,
  detectFormat,
  parse,
  setPrismWasmUrl,
  supportedFormatSchema,
} from '@liam-hq/db-structure/parser'
import * as Sentry from '@sentry/nextjs'
import { load } from 'cheerio'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import * as v from 'valibot'
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
  if (!parsedParams.success) return notFound()

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
    'Generate ER diagrams effortlessly by entering a schema file URL. Ideal for visualizing, reviewing, and documenting database structures.'

  return {
    title: metaTitle,
    description: metaDescription,
    openGraph: {
      url: `https://liambx.com/erd/p/${joinedPath}`,
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

  const blankDbStructure = { tables: {}, relationships: {} }

  const contentUrl = resolveContentUrl(url)
  if (!contentUrl) {
    return (
      <ERDViewer
        dbStructure={blankDbStructure}
        defaultSidebarOpen={false}
        errorObjects={[{ name: 'NetworkError', message: 'Invalid URL' }]}
      />
    )
  }
  const networkErrorObjects: {
    name: 'NetworkError'
    message: string
  }[] = []
  const pleaseCheck = `Please check the URL ${url} and try again`
  const res = await fetch(contentUrl, { cache: 'no-store' }).catch((e) => {
    if (e instanceof Error) {
      networkErrorObjects.push({
        name: 'NetworkError',
        message: `${e.name}: ${e.message}. ${pleaseCheck}.`,
      })
    } else {
      networkErrorObjects.push({
        name: 'NetworkError',
        message: `Unknown error. ${pleaseCheck}.`,
      })
    }
  })
  if (!res && networkErrorObjects.length === 0)
    networkErrorObjects.push({
      name: 'NetworkError',
      message: `Unknown error. ${pleaseCheck}.`,
    })
  if (!res || networkErrorObjects.length > 0) {
    return (
      <ERDViewer
        dbStructure={blankDbStructure}
        defaultSidebarOpen={false}
        errorObjects={networkErrorObjects}
      />
    )
  }
  if (!res.ok) {
    return (
      <ERDViewer
        dbStructure={blankDbStructure}
        defaultSidebarOpen={false}
        errorObjects={[
          {
            name: 'NetworkError',
            message: `HTTP status is ${res.status}: ${res.statusText}. ${pleaseCheck}.`,
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
        dbStructure={blankDbStructure}
        defaultSidebarOpen={false}
        errorObjects={[
          {
            name: 'NetworkError',
            message: 'We could not detect the format of the file',
          },
        ]}
      />
    )
  }

  let dbStructure = undefined
  let errors = []

  if (format === 'prisma') {
    const { processor } = await import('@liam-hq/schema-parser')
    const { value, errors: _errors } = await processor(input)
    dbStructure = value
    errors = _errors
  } else {
  const { value, errors: _errors } = await parse(input, format)
  dbStructure = value
  errors = _errors
  }

  for (const error of errors) {
    Sentry.captureException(error)
  }
  // @ts-expect-error
  const errorObjects = errors.map((error) => ({
    name: error.name,
    message: error.message,
  }))
  const cookieStore = await cookies()
  const defaultSidebarOpen = cookieStore.get('sidebar:state')?.value === 'true'

  return (
    <ERDViewer
      dbStructure={dbStructure}
      defaultSidebarOpen={defaultSidebarOpen}
      errorObjects={errorObjects}
    />
  )
}
