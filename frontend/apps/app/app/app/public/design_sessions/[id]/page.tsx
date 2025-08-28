import { notFound } from 'next/navigation'
import * as v from 'valibot'
import type { PageProps } from '@/app/types'
import { PublicSessionDetailPage } from '@/components/PublicSessionDetailPage'

const paramsSchema = v.object({
  id: v.string(),
})

// Prevent search engines from indexing public share pages
export const metadata = {
  robots: 'noindex, nofollow, noarchive',
}

// Cache configuration for public pages
export const revalidate = 60 // Revalidate every 60 seconds

export default async function Page({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) {
    notFound()
  }

  const designSessionId = parsedParams.output.id

  return <PublicSessionDetailPage designSessionId={designSessionId} />
}
