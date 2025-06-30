import {
  aCheckConstraint,
  aColumn,
  aForeignKeyConstraint,
  anIndex,
  aPrimaryKeyConstraint,
  aSchema,
  aTable,
  aUniqueConstraint,
} from '../../../schema/factories.js'
import type { Column } from '../../../schema/types.js'

export const createBasicColumn = (
  name: string,
  type: string,
  options?: Partial<Column>,
): Column => aColumn({ name, type, ...options })

export const createTableWithColumns = (
  tableName: string,
  columns: Record<string, Column>,
  options?: {
    constraints?: Record<string, any>
    indexes?: Record<string, any>
    comment?: string
  },
) =>
  aTable({
    name: tableName,
    columns,
    ...options,
  })

export const createPrimaryKeyConstraint = (name: string, columnName: string) =>
  aPrimaryKeyConstraint({ name, columnName })

export const createForeignKeyConstraint = (
  name: string,
  columnName: string,
  targetTableName: string,
  targetColumnName: string,
  options?: {
    updateConstraint?: string
    deleteConstraint?: string
  },
) =>
  aForeignKeyConstraint({
    name,
    columnName,
    targetTableName,
    targetColumnName,
    ...options,
  })

export const createIndex = (
  name: string,
  columns: string[],
  options?: {
    unique?: boolean
    type?: string
  },
) =>
  anIndex({
    name,
    columns,
    ...options,
  })

export const createUniqueConstraint = (name: string, columnName: string) =>
  aUniqueConstraint({ name, columnName })

export const createCheckConstraint = (name: string, detail: string) =>
  aCheckConstraint({ name, detail })

export const createSchemaWithTable = (tableName: string, table: any) =>
  aSchema({
    tables: {
      [tableName]: table,
    },
  })

export const createSchemaWithTables = (tables: Record<string, any>) =>
  aSchema({ tables })

export const SCHEMA_BUILDERS = {
  usersTable: () =>
    createTableWithColumns('users', {
      id: createBasicColumn('id', 'bigint', { notNull: true }),
      email: createBasicColumn('email', 'varchar(255)', { notNull: true }),
    }),

  productsTable: () =>
    createTableWithColumns('products', {
      id: createBasicColumn('id', 'bigint', { notNull: true }),
      name: createBasicColumn('name', 'varchar(100)', { notNull: true }),
      price: createBasicColumn('price', 'decimal(10,2)', {
        notNull: true,
        default: 0,
      }),
    }),

  ordersTable: () =>
    createTableWithColumns('orders', {
      id: createBasicColumn('id', 'bigint', { notNull: true }),
      user_id: createBasicColumn('user_id', 'bigint', { notNull: true }),
      product_id: createBasicColumn('product_id', 'bigint', { notNull: true }),
      quantity: createBasicColumn('quantity', 'integer', {
        notNull: true,
        default: 1,
      }),
    }),
}