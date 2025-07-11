import { BookMarked, ErdIcon, MessagesSquare } from '@liam-hq/ui'
import { type InferOutput, literal, union } from 'valibot'

export const PROJECT_TAB = {
  PROJECT: 'project',
  SCHEMA: 'schema',
  SESSIONS: 'sessions',
} as const

export const ProjectTabSchema = union([
  literal(PROJECT_TAB.PROJECT),
  literal(PROJECT_TAB.SCHEMA),
  literal(PROJECT_TAB.SESSIONS),
])

export type ProjectTabValue = InferOutput<typeof ProjectTabSchema>

type ProjectTab = {
  value: ProjectTabValue
  label: string
  icon: typeof BookMarked | typeof ErdIcon | typeof MessagesSquare
}

export const PROJECT_TABS: ProjectTab[] = [
  { value: PROJECT_TAB.PROJECT, label: 'Project', icon: BookMarked },
  { value: PROJECT_TAB.SCHEMA, label: 'Schema', icon: ErdIcon },
  { value: PROJECT_TAB.SESSIONS, label: 'Sessions', icon: MessagesSquare },
]
