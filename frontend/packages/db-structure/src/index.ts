export type {
  ColumnRelatedDiffItem,
  ConstraintRelatedDiffItem,
  IndexRelatedDiffItem,
  SchemaDiffItem,
  TableRelatedDiffItem,
} from './diff/index.js'
export { buildSchemaDiff, schemaDiffItemsSchema } from './diff/index.js'
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
  overrideSchema,
  type PrimaryKeyConstraint,
  type Relationships,
  type Schema,
  type SchemaOverride,
  schemaOverrideSchema,
  schemaSchema,
  type Table,
  type TableGroup,
  type TableGroups,
  type Tables,
  tableGroupSchema,
  tableGroupsSchema,
  type UniqueConstraint,
} from './schema/index.js'
