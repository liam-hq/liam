export {
  postgresqlOperationDeparser,
  postgresqlSchemaDeparser,
} from './deparser/postgresql/index.js'
export type { OperationDeparser, SchemaDeparser } from './deparser/type.js'
export type {
  ChangeStatus,
  ColumnRelatedDiffItem,
  ConstraintRelatedDiffItem,
  IndexRelatedDiffItem,
  SchemaDiffItem,
  TableRelatedDiffItem,
} from './diff/index.js'
export {
  buildSchemaDiff,
  columnRelatedDiffItemSchema,
  schemaDiffItemsSchema,
  tableRelatedDiffItemSchema,
} from './diff/index.js'
export { applyPatchOperations, operationsSchema } from './operation/index.js'
export type { ProcessError } from './parser.js'
export {
  aColumn,
  aRelationship,
  aTable,
  type Cardinality,
  type CheckConstraint,
  type Column,
  type Columns,
  type Constraint,
  type Constraints,
  columnSchema,
  type ForeignKeyConstraint,
  type Index,
  type Indexes,
  mergeSchemas,
  type PrimaryKeyConstraint,
  type Relationships,
  type Schema,
  schemaSchema,
  type Table,
  type Tables,
  type UniqueConstraint,
} from './schema/index.js'
