import type {
  CheckConstraint,
  Column,
  Enum,
  Enums,
  Extension,
  Extensions,
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

export const anEnum = (override?: Partial<Enum>): Enum => ({
  name: 'status',
  values: ['active', 'inactive'],
  comment: null,
  ...override,
})

export const anExtension = (override?: Partial<Extension>): Extension => ({
  name: 'uuid-ossp',
  ...override,
})

const tables = (override?: Tables): Tables => {
  return (
    override ?? {
      users: aTable({ name: 'users' }),
    }
  )
}

const enums = (override?: Enums): Enums => {
  return override ?? {}
}

const extensions = (override?: Extensions): Extensions => {
  return override ?? {}
}

export const aSchema = (override?: Partial<Schema>): Schema => ({
  tables: tables(override?.tables),
  enums: enums(override?.enums),
  extensions: extensions(override?.extensions),
})
