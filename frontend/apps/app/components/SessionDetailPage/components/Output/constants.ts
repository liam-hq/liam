export const OUTPUT_TABS = {
  DB_DESIGN: 'db-design',
  ARTIFACT: 'artifact',
} as const

type OutputTabValue = (typeof OUTPUT_TABS)[keyof typeof OUTPUT_TABS]

type OutputTab = {
  value: OutputTabValue
  label: string
}

export const OUTPUT_TABS_LIST: OutputTab[] = [
  { value: OUTPUT_TABS.DB_DESIGN, label: 'DB Design' },
  { value: OUTPUT_TABS.ARTIFACT, label: 'Artifact' },
]

export const DEFAULT_OUTPUT_TAB = OUTPUT_TABS.DB_DESIGN
