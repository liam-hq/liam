import { type InferOutput, literal, union } from 'valibot'

export const PROJECT_TAB = {
  PROJECT: 'project',
  SCHEMA: 'schema',
  SESSIONS: 'sessions',
} as const

const ProjectTabSchema = union([
  literal(PROJECT_TAB.PROJECT),
  literal(PROJECT_TAB.SCHEMA),
  literal(PROJECT_TAB.SESSIONS),
])

export type ProjectTabValue = InferOutput<typeof ProjectTabSchema>

export type ProjectTab = {
  value: ProjectTabValue
  label: string
}

export const PROJECT_TABS: ProjectTab[] = [
  { value: PROJECT_TAB.PROJECT, label: 'Project' },
  { value: PROJECT_TAB.SCHEMA, label: 'Schema' },
  { value: PROJECT_TAB.SESSIONS, label: 'Sessions' },
]
