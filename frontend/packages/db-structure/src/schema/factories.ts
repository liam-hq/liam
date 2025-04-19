import type {
  Column,
  Index,
  Relationship,
  Schema,
  Table,
  Tables,
} from './schema.js'

export const aColumn = (override?: Partial<Column>): Column => ({
  name: 'id',
  type: 'varchar',
  default: null,
  check: null,
  comment: null,
  primary: false,
  unique: false,
  notNull: false,
  ...override,
})

export const aTable = (override?: Partial<Table>): Table => ({
  name: 'users',
  comment: null,
  ...override,
  indexes: {
    ...override?.indexes,
  },
  columns: {
    ...override?.columns,
  },
  constraints: {
    ...override?.constraints,
  },
})

export const anIndex = (override?: Partial<Index>): Index => ({
  name: '',
  unique: false,
  columns: [],
  type: '',
  ...override,
})

export const aRelationship = (
  override?: Partial<Relationship>,
): Relationship => ({
  name: '',
  primaryTableName: '',
  primaryColumnName: '',
  foreignTableName: '',
  foreignColumnName: '',
  cardinality: 'ONE_TO_MANY',
  updateConstraint: 'NO_ACTION',
  deleteConstraint: 'NO_ACTION',
  ...override,
})

const tables = (override?: Tables): Tables => {
  return (
    override ?? {
      users: aTable({ name: 'users' }),
    }
  )
}

export const aSchema = (override?: Partial<Schema>): Schema => ({
  tables: tables(override?.tables),
  relationships: override?.relationships || {},
  tableGroups: override?.tableGroups || {},
})
