import type { PageProps } from '@/app/types'

import * as v from 'valibot'
import { SettingsPage } from './SettingsPage'

// Define schema for validation
const paramsSchema = v.object({
  projectId: v.string('Project ID must be a string'),
})

export default async function Page({ params }: PageProps) {
  // Validate and parse params
  const parsedParams = v.safeParse(paramsSchema, await params)
  if (!parsedParams.success) return null

  const { projectId } = parsedParams.output

  return <SettingsPage projectId={projectId} />
}
