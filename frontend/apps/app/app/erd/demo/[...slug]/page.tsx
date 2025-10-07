import { schemaSchema } from '@liam-hq/schema'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import * as v from 'valibot'
import type { PageProps } from '../../../types'
import ERDViewer from '../../p/[...slug]/erdViewer'

const paramsSchema = v.object({
  slug: v.array(v.string()),
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

const renderErrorView = (
  errors: Array<{ name: string; message: string; instruction?: string }>,
  fallbackMessage: string,
  fallbackInstruction: string,
) => {
  const blankSchema = { tables: {}, enums: {}, extensions: {} }

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
  const metaTitle = `${joinedPath} - Liam ERD Demo`
  const metaDescription =
    'View pre-parsed ER diagrams from JSON schema files. Ideal for sharing and reviewing schemas.'

  const imageUrl = '/assets/liam_erd.png'

  return {
    title: metaTitle,
    description: metaDescription,
    openGraph: {
      url: `https://liambx.com/erd/demo/${joinedPath}`,
      images: imageUrl,
    },
  }
}

export default async function Page({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) notFound()

  const joinedPath = parsedParams.output.slug.join('/')
  const url = `https://${joinedPath}`
  const weCannotAccess = `Our signal's lost in the void! No access at this time..`
  const pleaseCheck = `Double-check the transmission link ${url} and initiate contact again.`

  const contentUrl = resolveContentUrl(url)
  if (!contentUrl) {
    return renderErrorView([], weCannotAccess, pleaseCheck)
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

  if (!res) {
    return renderErrorView(networkErrorObjects, weCannotAccess, pleaseCheck)
  }

  let jsonData: unknown
  try {
    jsonData = await res.json()
  } catch (_e) {
    return renderErrorView(
      [
        {
          name: 'ParseError',
          message: 'Failed to parse JSON from the provided URL',
          instruction: 'Please ensure the URL points to a valid JSON file',
        },
      ],
      weCannotAccess,
      pleaseCheck,
    )
  }

  const parseResult = v.safeParse(schemaSchema, jsonData)
  if (!parseResult.success) {
    return renderErrorView(
      [
        {
          name: 'ValidationError',
          message: 'Invalid schema format',
          instruction:
            'Please ensure the JSON matches the expected schema format',
        },
      ],
      weCannotAccess,
      pleaseCheck,
    )
  }

  const schema = parseResult.output

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
      errorObjects={[]}
    />
  )
}
