import { parse } from '@liam-hq/db-structure/parser'
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

  // Currently supports Postgres only
  const { value: dbStructure, errors } = await parse(
    input,
    'schemarb',
    'node_modules/@liam-hq/db-structure/dist/parser/schemarb/prism.wasm',
  )
  if (errors.length > 0) {
    for (const error of errors) {
      console.error(error)
    }
  }

  return <ERDViewer dbStructure={dbStructure} />
}
