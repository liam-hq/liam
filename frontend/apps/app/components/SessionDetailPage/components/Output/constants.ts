export const OUTPUT_TABS = {
  ERD: 'erd',
  SCHEMA_UPDATES: 'schema-updates',
  ARTIFACT: 'artifact',
} as const

type OutputTabValue = (typeof OUTPUT_TABS)[keyof typeof OUTPUT_TABS]

type OutputTab = {
  value: OutputTabValue
  label: string
}

export const OUTPUT_TABS_LIST: OutputTab[] = [
  { value: OUTPUT_TABS.ERD, label: 'ERD' },
  { value: OUTPUT_TABS.SCHEMA_UPDATES, label: 'Schema Updates' },
  { value: OUTPUT_TABS.ARTIFACT, label: 'Artifact' },
]

export const DEFAULT_OUTPUT_TAB = OUTPUT_TABS.ERD
