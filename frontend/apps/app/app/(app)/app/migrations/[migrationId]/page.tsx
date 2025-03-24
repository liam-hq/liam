import type { PageProps } from '@/app/types'
import { MigrationDetailPage } from '@/features/migrations/pages/MigrationDetailPage'
import { notFound } from 'next/navigation'
import * as v from 'valibot'

const paramsSchema = v.object({
  migrationId: v.string(),
})

export default async function Page({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) return notFound()

  const { migrationId } = parsedParams.output

  return <MigrationDetailPage migrationId={migrationId} />
}
