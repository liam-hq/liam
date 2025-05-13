import type { PageProps } from '@/app/types'
import { InvitationPage } from '@/components/InvitationPage'

import * as v from 'valibot'

const paramsSchema = v.object({
  token: v.string(),
})

export default async function Page({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) throw new Error('Invalid token parameters')

  const { token } = parsedParams.output

  return <InvitationPage token={token} />
}
