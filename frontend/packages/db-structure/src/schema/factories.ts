import type {
  CheckConstraint,
  Column,
  ForeignKeyConstraint,
  Index,
  PrimaryKeyConstraint,
  Schema,
  Table,
  Tables,
  UniqueConstraint,
} from './schema.js'

export const aColumn = (override?: Partial<Column>): Column => ({
  name: 'id',
  type: 'varchar',
  default: null,
  check: null,
  comment: null,
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

export const aPrimaryKeyConstraint = (
  override?: Partial<PrimaryKeyConstraint>,
): PrimaryKeyConstraint => ({
  type: 'PRIMARY KEY',
  name: '',
  columnNames: [],
  ...override,
})

export const aForeignKeyConstraint = (
  override?: Partial<ForeignKeyConstraint>,
): ForeignKeyConstraint => ({
  type: 'FOREIGN KEY',
  name: '',
  columnNames: [],
  targetTableName: '',
  targetColumnNames: [],
  updateConstraint: 'NO_ACTION',
  deleteConstraint: 'NO_ACTION',
  ...override,
})

export const aUniqueConstraint = (
  override?: Partial<UniqueConstraint>,
): UniqueConstraint => ({
  type: 'UNIQUE',
  name: '',
  columnNames: [],
  ...override,
})

export const aCheckConstraint = (
  override?: Partial<CheckConstraint>,
): CheckConstraint => ({
  type: 'CHECK',
  name: '',
  detail: '',
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
})
