import { BookMarked, GitPullRequestArrow, LayoutGrid, Users } from '@liam-hq/ui'
import { type InferOutput, literal, union } from 'valibot'

export const SETTINGS_TAB = {
  GENERAL: 'general',
  MEMBERS: 'members',
  BILLING: 'billing',
  PROJECTS: 'projects',
} as const

export const SettingsTabSchema = union([
  literal(SETTINGS_TAB.GENERAL),
  literal(SETTINGS_TAB.MEMBERS),
  literal(SETTINGS_TAB.BILLING),
  literal(SETTINGS_TAB.PROJECTS),
])

export type SettingsTabValue = InferOutput<typeof SettingsTabSchema>

interface SettingsTab {
  value: SettingsTabValue
  label: string
  icon: typeof BookMarked
}

export const SETTINGS_TABS: SettingsTab[] = [
  { value: SETTINGS_TAB.GENERAL, label: 'General', icon: BookMarked },
  { value: SETTINGS_TAB.MEMBERS, label: 'Members', icon: Users },
  { value: SETTINGS_TAB.BILLING, label: 'Billing', icon: GitPullRequestArrow },
  { value: SETTINGS_TAB.PROJECTS, label: 'Projects', icon: LayoutGrid },
]
