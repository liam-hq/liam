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
  aForeignKeyConstraint,
  aSchema,
  aTable,
  aUniqueConstraint,
  type CheckConstraint,
  type Column,
  type Columns,
  type Constraint,
  type Constraints,
  columnSchema,
  type ForeignKeyConstraint,
  foreignKeyConstraintSchema,
  type Index,
  type Indexes,
  mergeSchemas,
  type PrimaryKeyConstraint,
  type Schema,
  schemaSchema,
  type Table,
  type Tables,
  type UniqueConstraint,
} from './schema/index.js'
export {
  type Cardinality,
  constraintsToRelationships,
  type Relationship,
  type Relationships,
} from './utils/constraintsToRelationships.js'
export { isPrimaryKey } from './utils/isPrimaryKey.js'
