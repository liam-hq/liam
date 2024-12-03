import type { Column, DBStructure, Table, Tables } from './dbStructure'

export const aColumn = (override?: Partial<Column>): Column => ({
  name: 'id',
  type: 'varchar',
  default: null,
  check: null,
  comment: null,
  primary: false,
  unique: false,
  notNull: false,
  increment: false,
  ...override,
})

export const aTable = (override?: Partial<Table>): Table => ({
  name: 'users',
  comment: null,
  ...override,
  indices: [],
  columns: {
    ...override?.columns,
  },
})

const tables = (override?: Tables): Tables => {
  return (
    override ?? {
      users: aTable({ name: 'users' }),
    }
  )
}

export const aDBStructure = (override?: Partial<DBStructure>): DBStructure => ({
  tables: tables(override?.tables),
  relationships: {},
})
