export const SCHEMA_TAB = {
  ERD: 'erd',
} as const

type SchemaTabValue = (typeof SCHEMA_TAB)[keyof typeof SCHEMA_TAB]

type SchemaTab = {
  value: SchemaTabValue
  label: string
}

export const SCHEMA_TABS: SchemaTab[] = [
  { value: SCHEMA_TAB.ERD, label: 'ERD' },
]

export const DEFAULT_SCHEMA_TAB = SCHEMA_TAB.ERD
