import {
  Breadcrumb,
  Callout,
  FooterNavi,
  Heading,
  Tab,
  Tabs,
} from '@/components'
import { source } from '@/lib/source'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/page'
import { notFound } from 'next/navigation'

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>
}) {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  const MDX = page.data.body

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      editOnGithub={{
        owner: 'liam-hq',
        repo: 'liam',
        sha: 'main',
        path: `frontend/apps/docs/content/docs/${page.file.path}`,
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
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX
          components={{
            ...defaultMdxComponents,
            Tabs,
            Tab,
            Callout,
            h1: (props) => <Heading as="h1" {...props} />,
            h2: (props) => <Heading as="h2" {...props} />,
            h3: (props) => <Heading as="h3" {...props} />,
            h4: (props) => <Heading as="h4" {...props} />,
            h5: (props) => <Heading as="h5" {...props} />,
            h6: (props) => <Heading as="h6" {...props} />,
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
  const page = source.getPage(params.slug)
  if (!page) notFound()

  return {
    metadataBase: new URL(baseUrl),
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: '/images/liam_erd.png',
    },
  }
}
