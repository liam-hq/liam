import type {
  AlterTableStmt,
  CommentStmt,
  CreateStmt,
  IndexStmt,
  List,
  Node,
  Constraint as PgConstraint,
  String as PgString,
  RawStmt,
} from '@pgsql/types'
import { err, ok, type Result } from 'neverthrow'
import type {
  CheckConstraint,
  Columns,
  Constraint,
  Constraints,
  ForeignKeyConstraint,
  ForeignKeyConstraintReferenceOption,
  Table,
} from '../../../schema/index.js'
import { type ProcessError, UnexpectedTokenWarningError } from '../../errors.js'
import type { ProcessResult } from '../../types.js'
import { defaultRelationshipName } from '../../utils/index.js'

function isStringNode(node: Node | undefined): node is { String: PgString } {
  return (
    node !== undefined &&
    'String' in node &&
    typeof node.String === 'object' &&
    node.String !== null &&
    'sval' in node.String &&
    node.String.sval !== 'pg_catalog'
  )
}

function isConstraintNode(node: Node): node is { Constraint: PgConstraint } {
  return (node as { Constraint: PgConstraint }).Constraint !== undefined
}

// ON UPDATE or ON DELETE subclauses for foreign key
// see: https://github.com/launchql/pgsql-parser/blob/pgsql-parser%4013.16.0/packages/deparser/src/deparser.ts#L3101-L3141
function getConstraintAction(
  action?: string,
): ForeignKeyConstraintReferenceOption {
  switch (action?.toLowerCase()) {
    case 'r':
      return 'RESTRICT'
    case 'c':
      return 'CASCADE'
    case 'n':
      return 'SET_NULL'
    case 'd':
      return 'SET_DEFAULT'
    case 'a':
      return 'NO_ACTION'
    default:
      return 'NO_ACTION' // Default to 'NO_ACTION' for unknown or missing values
  }
}

/**
 * Extract default value from constraints
 */
function extractDefaultValueFromConstraints(
  constraints: Node[] | undefined,
): string | number | boolean | null {
  if (!constraints) return null

  const constraintNodes = constraints.filter(isConstraintNode)
  for (const c of constraintNodes) {
    const constraint = (c as { Constraint: PgConstraint }).Constraint

    // Skip if not a default constraint or missing required properties
    if (
      constraint.contype !== 'CONSTR_DEFAULT' ||
      !constraint.raw_expr ||
      !('A_Const' in constraint.raw_expr)
    ) {
      continue
    }

    const aConst = constraint.raw_expr.A_Const

    // Extract string value
    if ('sval' in aConst && 'sval' in aConst.sval) {
      return aConst.sval.sval
    }

    // Extract integer value
    if ('ival' in aConst && 'ival' in aConst.ival) {
      return aConst.ival.ival
    }

    // Extract boolean value
    if ('boolval' in aConst && 'boolval' in aConst.boolval) {
      return aConst.boolval.boolval
    }
  }

  return null
}

const constraintToForeignKeyConstraint = (
  foreignTableName: string,
  foreignColumnName: string,
  constraint: PgConstraint,
): Result<ForeignKeyConstraint, UnexpectedTokenWarningError> => {
  if (constraint.contype !== 'CONSTR_FOREIGN') {
    return err(
      new UnexpectedTokenWarningError('contype "CONSTR_FOREIGN" is expected'),
    )
  }

  const primaryTableName = constraint.pktable?.relname
  const primaryColumnName = isStringNode(constraint.pk_attrs?.[0])
    ? constraint.pk_attrs[0].String.sval
    : undefined

  if (!primaryTableName || !primaryColumnName) {
    return err(
      new UnexpectedTokenWarningError('Invalid foreign key constraint'),
    )
  }

  const name =
    constraint.conname ??
    defaultRelationshipName(
      primaryTableName,
      primaryColumnName,
      foreignTableName,
      foreignColumnName,
    )
  const updateConstraint = getConstraintAction(constraint.fk_upd_action)
  const deleteConstraint = getConstraintAction(constraint.fk_del_action)

  const foreignKeyConstraint: ForeignKeyConstraint = {
    type: 'FOREIGN KEY',
    name,
    columnName: foreignColumnName,
    targetTableName: primaryTableName,
    targetColumnName: primaryColumnName,
    updateConstraint,
    deleteConstraint,
  }

  return ok(foreignKeyConstraint)
}

const constraintToCheckConstraint = (
  columnName: string | undefined,
  constraint: PgConstraint,
  rawSql: string,
): Result<CheckConstraint, UnexpectedTokenWarningError> => {
  if (constraint.contype !== 'CONSTR_CHECK') {
    return err(
      new UnexpectedTokenWarningError('contype "CONSTR_CHECK" is expected'),
    )
  }

  if (constraint.location === undefined) {
    return err(new UnexpectedTokenWarningError('Invalid check constraint'))
  }

  let openParenthesesCount = 0
  const startLocation = rawSql.indexOf('(', constraint.location)
  let endLocation: number | undefined = undefined
  for (let i = startLocation; i < rawSql.length; i++) {
    if (rawSql[i] === '(') {
      openParenthesesCount++
    } else if (rawSql[i] === ')') {
      openParenthesesCount--
      if (openParenthesesCount === 0) {
        endLocation = i
        break
      }
    }
  }

  if (startLocation === undefined || endLocation === undefined) {
    return err(new UnexpectedTokenWarningError('Invalid check constraint'))
  }

  const checkConstraint: CheckConstraint = {
    name: constraint.conname ?? `CHECK_${columnName}`,
    type: 'CHECK',
    detail: `CHECK ${rawSql.slice(startLocation, endLocation + 1)}`,
  }

  return ok(checkConstraint)
}

// Type definitions for internal use
interface ColumnDef {
  colname?: string
  typeName?: { names?: Node[] }
  constraints?: Node[]
}

interface Column {
  name: string
  type: string
  default: string | number | boolean | null
  check: string | null
  notNull: boolean
  comment: string | null
}

interface AlterTableCmd {
  subtype: string
  def?: Node
}

// Type guards for statement types
function isCreateStmt(stmt: Node): stmt is { CreateStmt: CreateStmt } {
  return 'CreateStmt' in stmt
}

function isIndexStmt(stmt: Node): stmt is { IndexStmt: IndexStmt } {
  return 'IndexStmt' in stmt
}

function isCommentStmt(stmt: Node): stmt is { CommentStmt: CommentStmt } {
  return 'CommentStmt' in stmt
}

function isAlterTableStmt(
  stmt: Node,
): stmt is { AlterTableStmt: AlterTableStmt } {
  return 'AlterTableStmt' in stmt
}

// Column analysis functions
function extractColumnType(typeName: { names?: Node[] } | undefined): string {
  return (
    typeName?.names
      ?.filter(isStringNode)
      .map((n) => n.String.sval)
      .join('') || ''
  )
}

function isPrimaryKey(constraints: Node[] | undefined): boolean {
  return (
    constraints
      ?.filter(isConstraintNode)
      .some((c) => c.Constraint.contype === 'CONSTR_PRIMARY') || false
  )
}

function isUnique(constraints: Node[] | undefined): boolean {
  return (
    constraints
      ?.filter(isConstraintNode)
      .some((c) =>
        ['CONSTR_UNIQUE', 'CONSTR_PRIMARY'].includes(
          c.Constraint.contype ?? '',
        ),
      ) || false
  )
}

function isNotNull(constraints: Node[] | undefined): boolean {
  return (
    constraints
      ?.filter(isConstraintNode)
      .some((c) => c.Constraint.contype === 'CONSTR_NOTNULL') ||
    // If primary key, it's not null
    isPrimaryKey(constraints) ||
    false
  )
}

function extractStringValue(item: Node): string | null {
  return 'String' in item &&
    typeof item.String === 'object' &&
    item.String !== null &&
    'sval' in item.String
    ? item.String.sval
    : null
}

// Constraint processing functions
function processConstraintsForColumn(
  tableName: string,
  columnName: string,
  constraints: Node[],
  rawSql: string,
  errors: ProcessError[],
): Constraint[] {
  const result: Constraint[] = []

  for (const constraint of constraints.filter(isConstraintNode)) {
    if (constraint.Constraint.contype === 'CONSTR_FOREIGN') {
      const relResult = constraintToForeignKeyConstraint(
        tableName,
        columnName,
        constraint.Constraint,
      )

      if (relResult.isErr()) {
        errors.push(relResult.error)
        continue
      }

      result.push(relResult.value)
    } else if (constraint.Constraint.contype === 'CONSTR_CHECK') {
      const relResult = constraintToCheckConstraint(
        columnName,
        constraint.Constraint,
        rawSql,
      )

      if (relResult.isErr()) {
        errors.push(relResult.error)
        continue
      }
      result.push(relResult.value)
    }
  }

  return result
}

function addConstraintsForColumn(
  columnConstraints: Node[] | undefined,
  columnName: string,
  constraints: Constraint[],
): void {
  if (isPrimaryKey(columnConstraints)) {
    constraints.push({
      name: `PRIMARY_${columnName}`,
      type: 'PRIMARY KEY',
      columnName,
    })
  }

  if (isUnique(columnConstraints) && !isPrimaryKey(columnConstraints)) {
    constraints.push({
      name: `UNIQUE_${columnName}`,
      type: 'UNIQUE',
      columnName,
    })
  }
}

function processColumnDef(
  colDef: ColumnDef,
  tableName: string,
  rawSql: string,
  errors: ProcessError[],
): {
  column: [string, Column] | null
  constraints: Constraint[]
} {
  const columnName = colDef.colname
  if (!columnName) {
    return { column: null, constraints: [] }
  }

  const column: Column = {
    name: columnName,
    type: extractColumnType(colDef.typeName),
    default: extractDefaultValueFromConstraints(colDef.constraints) || null,
    check: null,
    notNull: isNotNull(colDef.constraints),
    comment: null,
  }

  const constraints: Constraint[] = []

  // Process column-level constraints
  if (colDef.constraints) {
    const columnConstraints = processConstraintsForColumn(
      tableName,
      columnName,
      colDef.constraints,
      rawSql,
      errors,
    )
    constraints.push(...columnConstraints)
  }

  // Add PRIMARY KEY and UNIQUE constraints
  addConstraintsForColumn(colDef.constraints, columnName, constraints)

  return {
    column: [columnName, column],
    constraints,
  }
}

function processTableLevelConstraint(
  constraint: PgConstraint,
  tableName: string,
  rawSql: string,
  errors: ProcessError[],
): Constraint[] {
  const constraints: Constraint[] = []

  if (constraint.contype === 'CONSTR_PRIMARY') {
    const columnNames = constraint.keys
      ?.filter(isStringNode)
      .map((node) => node.String.sval)
      .filter((name): name is string => name !== undefined) || []

    for (const columnName of columnNames) {
      constraints.push({
        name: constraint.conname ?? `PRIMARY_${columnName}`,
        type: 'PRIMARY KEY',
        columnName,
      })
    }
  } else if (constraint.contype === 'CONSTR_FOREIGN') {
    const foreignColumnName =
      constraint.fk_attrs?.[0] && isStringNode(constraint.fk_attrs[0])
        ? constraint.fk_attrs[0].String.sval
        : undefined

    if (foreignColumnName) {
      const relResult = constraintToForeignKeyConstraint(
        tableName,
        foreignColumnName,
        constraint,
      )

      if (relResult.isErr()) {
        errors.push(relResult.error)
      } else {
        constraints.push(relResult.value)
      }
    }
  } else if (constraint.contype === 'CONSTR_CHECK') {
    const relResult = constraintToCheckConstraint(
      undefined,
      constraint,
      rawSql,
    )

    if (relResult.isErr()) {
      errors.push(relResult.error)
    } else {
      constraints.push(relResult.value)
    }
  } else if (constraint.contype === 'CONSTR_UNIQUE') {
    const columnNames = constraint.keys
      ?.filter(isStringNode)
      .map((node) => node.String.sval)
      .filter((name): name is string => name !== undefined) || []

    for (const columnName of columnNames) {
      constraints.push({
        name: constraint.conname ?? `UNIQUE_${columnName}`,
        type: 'UNIQUE',
        columnName,
      })
    }
  }

  return constraints
}

function processTableElements(
  tableElts: Node[],
  tableName: string,
  rawSql: string,
  errors: ProcessError[],
): { columns: Columns; constraints: Constraints } {
  const columns: Columns = {}
  const constraints: Constraints = {}

  for (const elt of tableElts) {
    if ('ColumnDef' in elt) {
      const { column, constraints: columnConstraints } = processColumnDef(
        elt.ColumnDef,
        tableName,
        rawSql,
        errors,
      )

      if (column) {
        columns[column[0]] = column[1]
      }

      for (const constraint of columnConstraints) {
        constraints[constraint.name] = constraint
      }
    } else if (isConstraintNode(elt)) {
      const tableLevelConstraints = processTableLevelConstraint(
        elt.Constraint,
        tableName,
        rawSql,
        errors,
      )

      for (const constraint of tableLevelConstraints) {
        constraints[constraint.name] = constraint
      }
    }
  }

  return { columns, constraints }
}

// Statement handler functions
function handleCreateStmt(
  createStmt: CreateStmt,
  tables: Record<string, Table>,
  rawSql: string,
  errors: ProcessError[],
): void {
  if (!createStmt?.relation?.relname || !createStmt.tableElts) return

  const tableName = createStmt.relation.relname
  const { columns, constraints } = processTableElements(
    createStmt.tableElts,
    tableName,
    rawSql,
    errors,
  )

  tables[tableName] = {
    name: tableName,
    columns,
    comment: null,
    indexes: {},
    constraints,
  }
}

function processIndexParams(indexParams: Node[]): string[] {
  return indexParams
    .map((param) => {
      if ('IndexElem' in param) {
        return param.IndexElem.name
      }
      return undefined
    })
    .filter((name): name is string => name !== undefined)
}

function handleIndexStmt(
  indexStmt: IndexStmt,
  tables: Record<string, Table>,
): void {
  if (
    !indexStmt?.idxname ||
    !indexStmt.relation?.relname ||
    !indexStmt.indexParams
  )
    return

  const indexName = indexStmt.idxname
  const tableName = indexStmt.relation.relname
  const unique = indexStmt.unique !== undefined
  const columns = processIndexParams(indexStmt.indexParams)
  const type = indexStmt.accessMethod ?? ''

  tables[tableName] = {
    name: tables[tableName]?.name || tableName,
    comment: tables[tableName]?.comment || null,
    columns: tables[tableName]?.columns || {},
    indexes: {
      ...tables[tableName]?.indexes,
      [indexName]: {
        name: indexName,
        unique: unique,
        columns,
        type,
      },
    },
    constraints: tables[tableName]?.constraints || {},
  }
}

function extractCommentListItems(
  commentStmt: CommentStmt,
): { list: Node[]; comment: string } | null {
  const objectNode = commentStmt.object
  if (!objectNode) return null

  const isList = (stmt: Node): stmt is { List: List } => 'List' in stmt
  if (!isList(objectNode)) return null

  const comment = commentStmt.comment
  if (!comment) return null

  const list = objectNode.List.items || []
  if (list.length === 0) return null

  return { list, comment }
}

function handleCommentStmt(
  commentStmt: CommentStmt,
  tables: Record<string, Table>,
): void {
  if (
    commentStmt.objtype !== 'OBJECT_TABLE' &&
    commentStmt.objtype !== 'OBJECT_COLUMN'
  )
    return

  const result = extractCommentListItems(commentStmt)
  if (!result) return

  if (commentStmt.objtype === 'OBJECT_TABLE') {
    const tableName = extractStringValue(result.list[result.list.length - 1])
    if (tableName && tables[tableName]) {
      tables[tableName].comment = result.comment
    }
  } else if (commentStmt.objtype === 'OBJECT_COLUMN') {
    const columnName = extractStringValue(result.list[result.list.length - 1])
    const tableName = extractStringValue(result.list[result.list.length - 2])
    if (tableName && columnName && tables[tableName]?.columns[columnName]) {
      tables[tableName].columns[columnName].comment = result.comment
    }
  }
}

function processAlterTableCommand(
  cmd: { AlterTableCmd?: AlterTableCmd },
  foreignTableName: string,
  rawSql: string,
  tables: Record<string, Table>,
  errors: ProcessError[],
): void {
  if (!('AlterTableCmd' in cmd)) return

  const alterTableCmd = cmd.AlterTableCmd
  if (alterTableCmd.subtype !== 'AT_AddConstraint') return

  const constraint = alterTableCmd.def
  if (!constraint || !isConstraintNode(constraint)) return

  if (constraint.Constraint.contype === 'CONSTR_FOREIGN') {
    const foreignColumnName =
      constraint.Constraint.fk_attrs?.[0] &&
      isStringNode(constraint.Constraint.fk_attrs[0])
        ? constraint.Constraint.fk_attrs[0].String.sval
        : undefined

    if (foreignColumnName) {
      const relResult = constraintToForeignKeyConstraint(
        foreignTableName,
        foreignColumnName,
        constraint.Constraint,
      )

      if (relResult.isErr()) {
        errors.push(relResult.error)
      } else {
        const table = tables[foreignTableName]
        if (table) {
          table.constraints[relResult.value.name] = relResult.value
        }
      }
    }
  } else if (constraint.Constraint.contype === 'CONSTR_CHECK') {
    const relResult = constraintToCheckConstraint(
      undefined,
      constraint.Constraint,
      rawSql,
    )

    if (relResult.isErr()) {
      errors.push(relResult.error)
    } else {
      const table = tables[foreignTableName]
      if (table) {
        table.constraints[relResult.value.name] = relResult.value
      }
    }
  }
}

function handleAlterTableStmt(
  alterTableStmt: AlterTableStmt,
  tables: Record<string, Table>,
  rawSql: string,
  errors: ProcessError[],
): void {
  if (!alterTableStmt?.relation?.relname || !alterTableStmt.cmds) return

  const foreignTableName = alterTableStmt.relation.relname

  for (const cmd of alterTableStmt.cmds) {
    processAlterTableCommand(
      cmd as { AlterTableCmd?: AlterTableCmd },
      foreignTableName,
      rawSql,
      tables,
      errors,
    )
  }
}

// Main transform function
export const convertToSchema = (
  stmts: RawStmt[],
  rawSql: string,
): ProcessResult => {
  const tables: Record<string, Table> = {}
  const errors: ProcessError[] = []

  for (const statement of stmts) {
    if (!statement?.stmt) continue

    const stmt = statement.stmt
    if (isCreateStmt(stmt)) {
      handleCreateStmt(stmt.CreateStmt, tables, rawSql, errors)
    } else if (isIndexStmt(stmt)) {
      handleIndexStmt(stmt.IndexStmt, tables)
    } else if (isCommentStmt(stmt)) {
      handleCommentStmt(stmt.CommentStmt, tables)
    } else if (isAlterTableStmt(stmt)) {
      handleAlterTableStmt(stmt.AlterTableStmt, tables, rawSql, errors)
    }
  }

  return {
    value: { tables },
    errors,
  }
}
