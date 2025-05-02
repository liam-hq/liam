export const SCHEMA_TAB = {
  ERD: 'erd',
  EDITOR: 'editor',
} as const

type SchemaTabValue = (typeof SCHEMA_TAB)[keyof typeof SCHEMA_TAB]

interface SchemaTab {
  value: SchemaTabValue
  label: string
}

export const SCHEMA_TABS: SchemaTab[] = [
  { value: SCHEMA_TAB.ERD, label: 'ERD' },
  { value: SCHEMA_TAB.EDITOR, label: 'Override' },
]

export const DEFAULT_SCHEMA_TAB = SCHEMA_TAB.ERD
