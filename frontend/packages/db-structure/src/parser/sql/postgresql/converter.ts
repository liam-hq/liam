import type {
  AlterTableStmt,
  CommentStmt,
  Constraint,
  CreateStmt,
  IndexStmt,
  List,
  Node,
  String as PgString,
  RawStmt,
} from '@pgsql/types'
import { type Result, err, ok } from 'neverthrow'
import type {
  Columns,
  ForeignKeyConstraint,
  Relationship,
  Table,
} from '../../../schema/index.js'
import { type ProcessError, UnexpectedTokenWarningError } from '../../errors.js'
import type { ProcessResult } from '../../types.js'
import {
  defaultRelationshipName,
  handleOneToOneRelationships,
} from '../../utils/index.js'

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

// ON UPDATE or ON DELETE subclauses for foreign key
// see: https://github.com/launchql/pgsql-parser/blob/pgsql-parser%4013.16.0/packages/deparser/src/deparser.ts#L3101-L3141
function getConstraintAction(action?: string): ForeignKeyConstraint {
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

const constraintToRelationship = (
  foreignTableName: string,
  foreignColumnName: string,
  constraint: Constraint,
): Result<Relationship | undefined, UnexpectedTokenWarningError> => {
  if (constraint.contype !== 'CONSTR_FOREIGN') {
    return ok(undefined)
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
  const cardinality = 'ONE_TO_MANY'

  return ok({
    name,
    primaryTableName,
    primaryColumnName,
    foreignTableName,
    foreignColumnName,
    cardinality,
    updateConstraint,
    deleteConstraint,
  })
}

// Transform function for AST to DBStructure
export const convertToDBStructure = (stmts: RawStmt[]): ProcessResult => {
  const tables: Record<string, Table> = {}
  const relationships: Record<string, Relationship> = {}
  const errors: ProcessError[] = []

  function isConstraintNode(node: Node): node is { Constraint: Constraint } {
    return (node as { Constraint: Constraint }).Constraint !== undefined
  }

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

  function handleCreateStmt(createStmt: CreateStmt) {
    if (!createStmt || !createStmt.relation || !createStmt.tableElts) return

    const tableName = createStmt.relation.relname
    if (!tableName) return

    const columns: Columns = {}
    for (const elt of createStmt.tableElts) {
      if ('ColumnDef' in elt) {
        const colDef = elt.ColumnDef
        if (colDef.colname === undefined) continue

        columns[colDef.colname] = {
          name: colDef.colname,
          type:
            colDef.typeName?.names
              ?.filter(isStringNode)
              .map((n) => n.String.sval)
              .join('') || '',
          default:
            colDef.constraints
              ?.filter(isConstraintNode)
              .reduce<string | number | boolean | null>((defaultValue, c) => {
                const constraint = c.Constraint
                if (
                  constraint.contype !== 'CONSTR_DEFAULT' ||
                  !constraint.raw_expr ||
                  !('A_Const' in constraint.raw_expr)
                )
                  return defaultValue

                const aConst = constraint.raw_expr.A_Const
                if ('sval' in aConst && 'sval' in aConst.sval)
                  return aConst.sval.sval
                if ('ival' in aConst && 'ival' in aConst.ival)
                  return aConst.ival.ival
                if ('boolval' in aConst && 'boolval' in aConst.boolval)
                  return aConst.boolval.boolval

                return defaultValue
              }, null) || null,
          check: null, // TODO
          primary:
            colDef.constraints
              ?.filter(isConstraintNode)
              .some((c) => c.Constraint.contype === 'CONSTR_PRIMARY') || false,
          unique:
            colDef.constraints
              ?.filter(isConstraintNode)
              .some((c) =>
                ['CONSTR_UNIQUE', 'CONSTR_PRIMARY'].includes(
                  c.Constraint.contype ?? '',
                ),
              ) || false,
          notNull:
            colDef.constraints
              ?.filter(isConstraintNode)
              .some((c) => c.Constraint.contype === 'CONSTR_NOTNULL') ||
            // If primary key, it's not null
            colDef.constraints
              ?.filter(isConstraintNode)
              .some((c) => c.Constraint.contype === 'CONSTR_PRIMARY') ||
            false,
          comment: null, // TODO
        }

        for (const constraint of (colDef.constraints ?? []).filter(
          isConstraintNode,
        )) {
          const relResult = constraintToRelationship(
            tableName,
            colDef.colname,
            constraint.Constraint,
          )
          if (relResult.isErr()) {
            errors.push(relResult.error)
            continue
          }
          if (relResult.value === undefined) continue
          const relationship = relResult.value

          relationships[relationship.name] = relationship
        }
      }
    }

    tables[tableName] = {
      name: tableName,
      columns,
      comment: null,
      indexes: {},
    }
  }

  function handleIndexStmt(indexStmt: IndexStmt) {
    if (
      !indexStmt ||
      !indexStmt.idxname ||
      !indexStmt.relation ||
      !indexStmt.indexParams
    )
      return

    const indexName = indexStmt.idxname
    const tableName = indexStmt.relation.relname
    const unique = indexStmt.unique !== undefined
    const columns = indexStmt.indexParams
      .map((param) => {
        if ('IndexElem' in param) {
          return param.IndexElem.name
        }
        return undefined
      })
      .filter((name): name is string => name !== undefined)
    const type = indexStmt.accessMethod ?? ''

    if (tableName) {
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
      }
    }
  }

  function handleCommentStmt(commentStmt: CommentStmt) {
    if (
      commentStmt.objtype !== 'OBJECT_TABLE' &&
      commentStmt.objtype !== 'OBJECT_COLUMN'
    )
      return
    const objectNode = commentStmt.object
    if (!objectNode) return
    const isList = (stmt: Node): stmt is { List: List } => 'List' in stmt
    if (!isList(objectNode)) return

    const comment = commentStmt.comment
    if (!comment) return

    const extractStringValue = (item: Node): string | null =>
      'String' in item &&
      typeof item.String === 'object' &&
      item.String !== null &&
      'sval' in item.String
        ? item.String.sval
        : null

    const list = objectNode.List.items || []
    const last1 = list[list.length - 1]
    const last2 = list[list.length - 2]
    if (!last1) return

    switch (commentStmt.objtype) {
      case 'OBJECT_TABLE': {
        // Supports both of the following formats, but currently ignores the validity of `scope_name` values:
        // `COMMENT ON TABLE <scope_name>.<table_name> IS '<comment>';`
        // or
        // `COMMENT ON TABLE <table_name> IS '<comment>';`
        const tableName = extractStringValue(last1)
        if (!tableName) return
        if (!tables[tableName]) return
        tables[tableName].comment = comment
        return
      }
      case 'OBJECT_COLUMN': {
        // Supports both of the following formats, but currently ignores the validity of `scope_name` values:
        // `COMMENT ON COLUMN <scope_name>.<table_name>.<column_name> IS '<comment>';`
        // or
        // `COMMENT ON COLUMN <table_name>.<column_name> IS '<comment>';`
        if (!last2) return
        const tableName = extractStringValue(last2)
        if (!tableName) return
        if (!tables[tableName]) return
        const columnName = extractStringValue(last1)
        if (!columnName) return
        if (!tables[tableName].columns[columnName]) return
        tables[tableName].columns[columnName].comment = comment
        return
      }
      default:
      // NOTE: unexpected, but do nothing for now.
    }
  }

  function handleAlterTableStmt(alterTableStmt: AlterTableStmt) {
    if (!alterTableStmt || !alterTableStmt.relation || !alterTableStmt.cmds)
      return

    const foreignTableName = alterTableStmt.relation.relname
    if (!foreignTableName) return

    for (const cmd of alterTableStmt.cmds) {
      if (!('AlterTableCmd' in cmd)) continue

      const alterTableCmd = cmd.AlterTableCmd
      if (alterTableCmd.subtype === 'AT_AddConstraint') {
        const constraint = alterTableCmd.def
        if (!constraint || !isConstraintNode(constraint)) continue
        const foreignColumnName =
          constraint.Constraint.fk_attrs?.[0] &&
          isStringNode(constraint.Constraint.fk_attrs[0])
            ? constraint.Constraint.fk_attrs[0].String.sval
            : undefined
        if (foreignColumnName === undefined) continue

        const relResult = constraintToRelationship(
          foreignTableName,
          foreignColumnName,
          constraint.Constraint,
        )
        if (relResult.isErr()) {
          errors.push(relResult.error)
          continue
        }
        if (relResult.value === undefined) continue
        const relationship = relResult.value

        relationships[relationship.name] = relationship
      }
    }
  }

  for (const statement of stmts) {
    if (statement?.stmt === undefined) continue

    const stmt = statement.stmt
    if (isCreateStmt(stmt)) {
      handleCreateStmt(stmt.CreateStmt)
    } else if (isIndexStmt(stmt)) {
      handleIndexStmt(stmt.IndexStmt)
    } else if (isCommentStmt(stmt)) {
      handleCommentStmt(stmt.CommentStmt)
    } else if (isAlterTableStmt(stmt)) {
      handleAlterTableStmt(stmt.AlterTableStmt)
    }
  }

  handleOneToOneRelationships(tables, relationships)

  return {
    value: {
      tables,
      relationships,
    },
    errors,
  }
}
