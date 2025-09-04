import { notFound } from 'next/navigation'
import * as v from 'valibot'
import { InvitationPage } from '../../../../../../../components/InvitationPage'
import type { PageProps } from '../../../../../../types'

const paramsSchema = v.object({
  token: v.string(),
})

export default async function Page({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) notFound()

  const { token } = parsedParams.output

  return <InvitationPage token={token} />
}
