// biome-ignore lint/correctness/noNodejsModules: Required for the server component to read the wasm file
import path from 'node:path'
import { parse, setPrismWasmUrl } from '@liam-hq/db-structure/parser'
import * as Sentry from '@sentry/nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import ERDViewer from './erdViewer'

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {
  const { slug } = await params
  const joinedPath = slug.join('/')
  if (!joinedPath) {
    notFound()
  }

  const contentUrl = `https://${joinedPath}`

  const res = await fetch(contentUrl, { cache: 'no-store' })
  if (!res.ok) {
    notFound()
  }

  const input = await res.text()

  setPrismWasmUrl(path.resolve(process.cwd(), 'prism.wasm'))

  // Currently supports schema.rb only
  const { value: dbStructure, errors } = await parse(input, 'schemarb')
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
