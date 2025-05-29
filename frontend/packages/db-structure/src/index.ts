export {
  type Schema,
  type Table,
  type Tables,
  type Columns,
  type Column,
  type Index,
  type Indexes,
  type Relationships,
  type Cardinality,
  type TableGroup,
  type TableGroups,
  type Constraint,
  type Constraints,
  type PrimaryKeyConstraint,
  type ForeignKeyConstraint,
  type UniqueConstraint,
  type CheckConstraint,
  type SchemaOverride,
  columnSchema,
  schemaSchema,
  aTable,
  aColumn,
  aRelationship,
  overrideSchema,
  schemaOverrideSchema,
  tableGroupSchema,
  tableGroupsSchema,
} from './schema/index.js'

export type { ProcessError } from './parser.js'

export { buildSchemaDiff, schemaDiffItemsSchema } from './diff/index.js'
export type {
  SchemaDiffItem,
  TableRelatedDiffItem,
  ColumnRelatedDiffItem,
  IndexRelatedDiffItem,
  ConstraintRelatedDiffItem,
} from './diff/index.js'
