export const OUTPUT_TABS = {
  ERD: 'erd',
  MIGRATIONS: 'migrations',
  ARTIFACT: 'artifact',
} as const

export type OutputTabValue = (typeof OUTPUT_TABS)[keyof typeof OUTPUT_TABS]

type OutputTab = {
  value: OutputTabValue
  label: string
}

export const ARTIFACT_TAB: OutputTab = {
  value: OUTPUT_TABS.ARTIFACT,
  label: 'Artifact',
}

export const ERD_SCHEMA_TABS_LIST: OutputTab[] = [
  { value: OUTPUT_TABS.ERD, label: 'ERD' },
  { value: OUTPUT_TABS.MIGRATIONS, label: 'Migrations' },
]

export const DEFAULT_OUTPUT_TAB = OUTPUT_TABS.ERD
