// biome-ignore lint/correctness/noNodejsModules: Required for the server component to read the wasm file
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

export default async function Page({
  params,
  searchParams: _searchParams,
}: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) {
    notFound()
  }

  const joinedPath = parsedParams.output.slug.join('/')
  if (!joinedPath) {
    notFound()
  }

  const url = `https://${joinedPath}`
  const contentUrl = resolveContentUrl(url)
  if (!contentUrl) notFound()

  const res = await fetch(contentUrl, { cache: 'no-store' }).catch(() => {
    notFound()
  })
  if (!res.ok) notFound()

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
    // TODO: Show error message in the UI
    notFound()
  }

  const { value: dbStructure, errors } = await parse(input, format)
  // TODO: Show error message in the UI
  if (errors.length > 0) {
    for (const error of errors) {
      Sentry.captureException(error)
      console.error(error)
    }
  }

  const cookieStore = await cookies()
  const defaultSidebarOpen = cookieStore.get('sidebar:state')?.value === 'true'

  return (
    <ERDViewer
      dbStructure={dbStructure}
      defaultSidebarOpen={defaultSidebarOpen}
    />
  )
}
