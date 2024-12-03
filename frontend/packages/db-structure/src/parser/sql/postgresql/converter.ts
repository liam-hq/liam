import type {
  Constraint,
  CreateStmt,
  Node,
  String as PgString,
} from '@pgsql/types'
import type { Columns, DBStructure, Relationship, Table } from 'src/schema'
import type { RawStmtWrapper } from './parser'

// Transform function for AST to DBStructure
export const convertToDBStructure = (ast: RawStmtWrapper[]): DBStructure => {
  const tables: Record<string, Table> = {}
  const relationships: Record<string, Relationship> = {}

  function isStringNode(node: Node): node is { String: PgString } {
    return (
      'String' in node &&
      typeof node.String === 'object' &&
      node.String !== null &&
      'sval' in node.String &&
      node.String.sval !== 'pg_catalog'
    )
  }

  function isConstraintNode(node: Node): node is { Constraint: Constraint } {
    return (node as { Constraint: Constraint }).Constraint !== undefined
  }

  function isCreateStmt(stmt: Node): stmt is { CreateStmt: CreateStmt } {
    return 'CreateStmt' in stmt
  }

  if (!ast) {
    return {
      tables: {},
      relationships: {},
    }
  }

  // pg-query-emscripten does not have types, so we need to define them ourselves
  // @ts-expect-error
  for (const statement of ast.parse_tree.stmts) {
    if (statement?.stmt === undefined) continue
    const stmt = statement.stmt
    if (isCreateStmt(stmt)) {
      const createStmt = stmt.CreateStmt
      if (!createStmt || !createStmt.relation || !createStmt.tableElts) continue

      const tableName = createStmt.relation.relname
      const columns: Columns = {}
      for (const elt of createStmt.tableElts) {
        if ('ColumnDef' in elt) {
          const colDef = elt.ColumnDef
          columns[colDef.colname || ''] = {
            name: colDef.colname || '',
            type:
              colDef.typeName?.names
                ?.filter(isStringNode)
                .map((n) => n.String.sval)
                .join('') || '',
            default: null, // TODO
            check: null, // TODO
            primary:
              colDef.constraints
                ?.filter(isConstraintNode)
                .some((c) => c.Constraint.contype === 'CONSTR_PRIMARY') ||
              false,
            unique:
              colDef.constraints
                ?.filter(isConstraintNode)
                .some((c) => c.Constraint.contype === 'CONSTR_UNIQUE') || false,
            notNull:
              colDef.constraints
                ?.filter(isConstraintNode)
                .some((c) => c.Constraint.contype === 'CONSTR_NOTNULL') ||
              // If primary key, it's not null
              colDef.constraints
                ?.filter(isConstraintNode)
                .some((c) => c.Constraint.contype === 'CONSTR_PRIMARY') ||
              false,
            increment:
              colDef.typeName?.names
                ?.filter(isStringNode)
                .some((n) => n.String.sval === 'serial') || false,
            comment: null, // TODO
          }

          // Handle REFERENCES constraints for relationships

          // Update or delete constraint for foreign key
          // see: https://github.com/launchql/pgsql-parser/blob/main/packages/deparser/src/deparser.ts#L3101-L3141
          const getConstraintAction = (action?: string): string => {
            switch (action?.toLowerCase()) {
              case 'r':
                return 'RESTRICT'
              case 'c':
                return 'CASCADE'
              case 'n':
                return 'SET NULL'
              case 'd':
                return 'SET DEFAULT'
              case 'a':
                return 'NO ACTION'
              default:
                return 'NO ACTION' // Default to 'NO ACTION' for unknown or missing values
            }
          }

          for (const constraint of (colDef.constraints ?? []).filter(
            isConstraintNode,
          )) {
            if (constraint.Constraint.contype !== 'CONSTR_FOREIGN') {
              continue
            }

            const foreign = constraint.Constraint
            const primaryTableName = foreign.pktable?.relname
            const primaryColumnName =
              foreign.pk_attrs?.[0] && isStringNode(foreign.pk_attrs[0])
                ? (foreign.pk_attrs[0].String.sval ?? 'id')
                : 'id'
            const foreignColumnName = colDef.colname || ''

            if (primaryTableName && tableName) {
              // relationshipName example: "users_posts"
              const relationshipName = `${primaryTableName}_${tableName}`
              const updateConstraint = getConstraintAction(
                foreign.fk_upd_action,
              )
              const deleteConstraint = getConstraintAction(
                foreign.fk_del_action,
              )

              relationships[relationshipName] = {
                name: relationshipName,
                primaryTableName,
                primaryColumnName,
                foreignTableName: tableName,
                foreignColumnName,
                cardinality: 'ONE_TO_MANY', // TODO: Consider implementing other cardinalities
                updateConstraint,
                deleteConstraint,
              }
            }
          }
        }
      }

      if (tableName) {
        tables[tableName] = {
          name: tableName,
          columns,
          comment: null, // TODO
          indices: [], // TODO
        }
      }
    }
  }

  return {
    tables,
    relationships,
  }
}
