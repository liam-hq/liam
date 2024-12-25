// biome-ignore lint/correctness/noNodejsModules: <explanation>
import path from 'node:path'
// biome-ignore lint/correctness/noNodejsModules: <explanation>
import { fileURLToPath } from 'node:url'
import { parse, setPrismWasmUrl } from '@liam-hq/db-structure/parser'
// import prismWasmUrl from '@liam-hq/db-structure/parser/schemarb/prism.wasm'
import { notFound } from 'next/navigation'
// biome-ignore lint/nursery/useImportRestrictions: <explanation>
import ERDViewer from './p/[...slug]/erdViewer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const nextJsRootDir = path.resolve(__dirname, '../../')

function resolve(importMetaUrl: string, ...paths: string[]) {
  const dirname = path.dirname(fileURLToPath(importMetaUrl))
  const absPath = path.resolve(dirname, ...paths)
  // Required for ISR serverless functions to pick up the file path
  // as a dependency to bundle.
  return path.resolve(process.cwd(), absPath.replace(nextJsRootDir, '.'))
}

export default async function Page() {
  // const { slug } = await params
  // const joinedPath = slug.join('/')
  // if (!joinedPath) {
  //   notFound()
  // }

  const contentUrl =
    'https://raw.githubusercontent.com/mastodon/mastodon/877090518682b6c77ba9bdfa0231afd56daec44d/db/schema.rb'

  const res = await fetch(contentUrl, { cache: 'no-store' })
  if (!res.ok) {
    notFound()
  }

  const input = await res.text()

  setPrismWasmUrl(resolve(import.meta.url, 'prism.wasm'))

  // Currently supports Postgres only
  const { value: dbStructure, errors } = await parse(input, 'schemarb')
  if (errors.length > 0) {
    for (const error of errors) {
      console.error(error)
    }
  }
  // const dbStructure = {
  //   tables: {},
  //   relationships: {},
  // }

  return <ERDViewer dbStructure={dbStructure} defaultSidebarOpen />
}
