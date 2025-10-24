import type { InferPageType } from 'fumadocs-core/source'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/page'
import { notFound } from 'next/navigation'
import type { ComponentProps } from 'react'
import {
  Breadcrumb,
  Callout,
  FooterNavi,
  Heading,
  Tab,
  Tabs,
} from '../../../components'
import { source } from '../../../lib/source'

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>
}) {
  const params = await props.params
  type SourcePage = InferPageType<typeof source>
  const pageMaybe: SourcePage | undefined = source.getPage(params.slug)
  if (!pageMaybe) notFound()
  const page: SourcePage = pageMaybe
  const {
    data: { body: MDX, toc, full, title, description },
    file: { path: filePath },
  } = page

  return (
    <DocsPage
      toc={toc}
      full={full}
      editOnGithub={{
        owner: 'liam-hq',
        repo: 'liam',
        sha: 'main',
        path: `frontend/apps/docs/content/docs/${filePath}`,
      }}
      breadcrumb={{
        enabled: true,
        component: <Breadcrumb pageTree={source.pageTree} />,
      }}
      footer={{
        enabled: true,
        component: <FooterNavi pageTree={source.pageTree} />,
      }}
    >
      <DocsTitle>{title}</DocsTitle>
      <DocsDescription>{description}</DocsDescription>
      <DocsBody>
        <MDX
          components={{
            ...defaultMdxComponents,
            Tabs,
            Tab,
            Callout,
            h1: (props: ComponentProps<'h1'>) => <Heading as="h1" {...props} />,
            h2: (props: ComponentProps<'h2'>) => <Heading as="h2" {...props} />,
            h3: (props: ComponentProps<'h3'>) => <Heading as="h3" {...props} />,
            h4: (props: ComponentProps<'h4'>) => <Heading as="h4" {...props} />,
            h5: (props: ComponentProps<'h5'>) => <Heading as="h5" {...props} />,
            h6: (props: ComponentProps<'h6'>) => <Heading as="h6" {...props} />,
          }}
        />
      </DocsBody>
    </DocsPage>
  )
}

export async function generateStaticParams() {
  return source.generateParams()
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>
}) {
  const params = await props.params
  type SourcePage = InferPageType<typeof source>
  const pageMaybe: SourcePage | undefined = source.getPage(params.slug)
  if (!pageMaybe) notFound()
  const page: SourcePage = pageMaybe
  const {
    data: { title, description },
  } = page

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    openGraph: {
      images: '/images/liam_erd.png',
    },
  }
}
