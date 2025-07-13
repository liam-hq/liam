import type {
  CheckConstraint,
  Column,
  ForeignKeyConstraint,
  Index,
  InterleaveConstraint,
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
  columnName: '',
  ...override,
})

export const aForeignKeyConstraint = (
  override?: Partial<ForeignKeyConstraint>,
): ForeignKeyConstraint => ({
  type: 'FOREIGN KEY',
  name: '',
  columnName: '',
  targetTableName: '',
  targetColumnName: '',
  updateConstraint: 'NO_ACTION',
  deleteConstraint: 'NO_ACTION',
  ...override,
})

export const aUniqueConstraint = (
  override?: Partial<UniqueConstraint>,
): UniqueConstraint => ({
  type: 'UNIQUE',
  name: '',
  columnName: '',
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

export const aInterleaveConstraint = (
  override?: Partial<InterleaveConstraint>,
): InterleaveConstraint => ({
  type: 'INTERLEAVE',
  name: '',
  columnName: '',
  targetTableName: '',
  targetColumnName: '',
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
})
