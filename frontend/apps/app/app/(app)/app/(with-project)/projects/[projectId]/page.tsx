import { redirect } from 'next/navigation'
import * as v from 'valibot'
import type { PageProps } from '@/app/types'

const paramsSchema = v.object({
  projectId: v.string(),
})

export default async function Page({ params }: PageProps) {
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) throw new Error('Invalid project parameters')

  const { projectId } = parsedParams.output

  // Redirect to the branch detail page with 'main' as the default branch
  return redirect(`/app/projects/${projectId}/ref/main`)
}
