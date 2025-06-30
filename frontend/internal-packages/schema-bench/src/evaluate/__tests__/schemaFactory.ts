import type { Schema, Table, Column, Constraint } from '@liam-hq/db-structure'

// カラムのデフォルト値を定義
const defaultColumn: Omit<Column, 'name' | 'type'> = {
  default: null,
  check: null,
  primary: false,
  unique: false,
  notNull: true,
  comment: null,
}

// よく使うカラムタイプのファクトリ
export const createIdColumn = (name = 'id'): Column => ({
  ...defaultColumn,
  name,
  type: 'INTEGER',
  primary: true,
  notNull: true,
})

export const createVarcharColumn = (name: string, length = 255, options: Partial<Column> = {}): Column => ({
  ...defaultColumn,
  name,
  type: `VARCHAR(${length})`,
  ...options,
})

export const createTextColumn = (name: string, options: Partial<Column> = {}): Column => ({
  ...defaultColumn,
  name,
  type: 'TEXT',
  ...options,
})

export const createIntegerColumn = (name: string, options: Partial<Column> = {}): Column => ({
  ...defaultColumn,
  name,
  type: 'INTEGER',
  ...options,
})

// Primary Key制約のファクトリ
export const createPrimaryKeyConstraint = (tableName: string, columnName = 'id'): Constraint => ({
  type: 'PRIMARY KEY',
  name: `pk_${tableName}`,
  columnName,
})

// Foreign Key制約のファクトリ
export const createForeignKeyConstraint = (
  tableName: string,
  columnName: string,
  targetTableName: string,
  targetColumnName = 'id',
  name?: string
): Constraint => ({
  type: 'FOREIGN KEY',
  name: name || `fk_${tableName}_${columnName}`,
  columnName,
  targetTableName,
  targetColumnName,
  updateConstraint: 'NO_ACTION',
  deleteConstraint: 'NO_ACTION',
})

// テーブルのファクトリ
export const createTable = (
  name: string,
  columns: Record<string, Column>,
  constraints: Record<string, Constraint> = {}
): Table => ({
  name,
  columns,
  comment: null,
  indexes: {},
  constraints,
})

// よく使うテーブルパターンのファクトリ
export const createUserTable = (options: {
  tableName?: string
  idColumnName?: string
  additionalColumns?: Record<string, Column>
} = {}): Table => {
  const tableName = options.tableName || 'user'
  const idColumnName = options.idColumnName || 'id'
  
  return createTable(
    tableName,
    {
      [idColumnName]: createIdColumn(idColumnName),
      ...options.additionalColumns,
    },
    {
      [`pk_${tableName}`]: createPrimaryKeyConstraint(tableName, idColumnName),
    }
  )
}

export const createPostTable = (options: {
  tableName?: string
  userIdColumnName?: string
  userTableName?: string
  additionalColumns?: Record<string, Column>
} = {}): Table => {
  const tableName = options.tableName || 'post'
  const userIdColumnName = options.userIdColumnName || 'user_id'
  const userTableName = options.userTableName || 'user'
  
  const constraints: Record<string, Constraint> = {
    [`pk_${tableName}`]: createPrimaryKeyConstraint(tableName),
  }
  
  if (userIdColumnName && userTableName) {
    constraints[`fk_${tableName}_${userIdColumnName}`] = createForeignKeyConstraint(
      tableName,
      userIdColumnName,
      userTableName
    )
  }
  
  return createTable(
    tableName,
    {
      id: createIdColumn(),
      [userIdColumnName]: createIntegerColumn(userIdColumnName),
      ...options.additionalColumns,
    },
    constraints
  )
}

// スキーマのファクトリ
export const createSchema = (tables: Record<string, Table>): Schema => ({
  tables,
})