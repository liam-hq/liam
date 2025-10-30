export {
  postgresqlMigrationOperationDeparser,
  postgresqlSchemaDeparser,
} from './deparser/postgresql/index.js'
export type {
  LegacyOperationDeparser,
  LegacySchemaDeparser,
  OperationDeparser,
  SchemaDeparser,
} from './deparser/type.js'
export { yamlSchemaDeparser } from './deparser/yaml/index.js'
export { PATH_PATTERNS } from './migrationOperation/constants.js'
export {
  applyPatchOperations,
  type ChangeStatus,
  getColumnCommentChangeStatus,
  getColumnDefaultChangeStatus,
  getColumnNotNullChangeStatus,
  getColumnRelatedChangeStatus,
  getColumnTypeChangeStatus,
  getConstraintColumnNameChangeStatus,
  getConstraintColumnNamesChangeStatus,
  getConstraintDeleteConstraintChangeStatus,
  getConstraintDetailChangeStatus,
  getConstraintRelatedChangeStatus,
  getConstraintTargetColumnNameChangeStatus,
  getConstraintTargetTableNameChangeStatus,
  getConstraintUpdateConstraintChangeStatus,
  getIndexColumnsChangeStatus,
  getIndexNameChangeStatus,
  getIndexRelatedChangeStatus,
  getIndexTypeChangeStatus,
  getIndexUniqueChangeStatus,
  getMigrationOperations,
  getTableChangeStatus,
  getTableCommentChangeStatus,
  getTableRelatedChangeStatus,
  type MigrationOperation,
  migrationOperationsSchema,
} from './migrationOperation/index.js'
export type { ProcessError } from './parser.js'
export {
  aColumn,
  aForeignKeyConstraint,
  anIndex,
  aPrimaryKeyConstraint,
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
export { isEmptySchema } from './utils/isEmptySchema.js'
export { isPrimaryKey } from './utils/isPrimaryKey.js'
