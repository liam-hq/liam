import { FileText, ShieldCheck, SquareTerminal, Table2 } from '@liam-hq/ui'

export const TAB_VALUES = {
  DB_DESIGN: 'dbDesign',
  BRD: 'brd',
  QA: 'qa',
  QE: 'qe',
} as const

export const TAB_CONFIGS = [
  {
    value: TAB_VALUES.DB_DESIGN,
    label: 'Database Design',
    icon: Table2,
  },
  {
    value: TAB_VALUES.BRD,
    label: 'Business Requirement Document',
    icon: FileText,
  },
  {
    value: TAB_VALUES.QA,
    label: 'QA',
    icon: ShieldCheck,
  },
  {
    value: TAB_VALUES.QE,
    label: 'Query Executor',
    icon: SquareTerminal,
  },
] as const
