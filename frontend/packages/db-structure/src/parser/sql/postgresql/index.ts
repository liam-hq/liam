import type { RawStmt } from '@pgsql/types'
// pg-query-emscripten does not have types, so we need to define them ourselves
// @ts-expect-error
import Module from 'pg-query-emscripten'

import type { Processor } from '../../types.js'

export const parse = async (str: string): Promise<RawStmtWrapper[]> => {
  const pgQuery = await new Module()
  const result = pgQuery.parse(str)
  return result
}

import type {
  Constraint,
  CreateStmt,
  IndexStmt,
  Node,
  String as PgString,
} from '@pgsql/types'
import type {
  Columns,
  DBStructure,
  Relationship,
  Table,
} from '../../../schema/index.js'

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

  function isIndexStmt(stmt: Node): stmt is { IndexStmt: IndexStmt } {
    return 'IndexStmt' in stmt
  }

  function handleCreateStmt(createStmt: CreateStmt) {
    if (!createStmt || !createStmt.relation || !createStmt.tableElts) return

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
        // see: https://github.com/launchql/pgsql-parser/blob/pgsql-parser%4013.16.0/packages/deparser/src/deparser.ts#L3101-L3141
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
              ? foreign.pk_attrs[0].String.sval
              : undefined

          if (!primaryTableName || !primaryColumnName) {
            throw new Error('Invalid foreign key constraint')
          }

          const foreignColumnName = colDef.colname || ''

          if (primaryTableName && tableName) {
            // relationshipName example: "users_id_to_posts_user_id"
            const relationshipName = `${primaryTableName}_${primaryColumnName}_to_${tableName}_${foreignColumnName}`
            const updateConstraint = getConstraintAction(foreign.fk_upd_action)
            const deleteConstraint = getConstraintAction(foreign.fk_del_action)

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
        indices: {},
      }
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

    if (tableName) {
      tables[tableName] = {
        name: tables[tableName]?.name || tableName,
        comment: tables[tableName]?.comment || null,
        columns: tables[tableName]?.columns || {},
        indices: {
          ...tables[tableName]?.indices,
          [indexName]: {
            name: indexName,
            unique: unique,
            columns,
          },
        },
      }
    }
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
      handleCreateStmt(stmt.CreateStmt)
    } else if (isIndexStmt(stmt)) {
      handleIndexStmt(stmt.IndexStmt)
    }
  }

  return {
    tables,
    relationships,
  }
}

// It was expected that postgresParse would return a ParseResult object,
// but it was found that an array of RawStmtWrapper objects was returned.
export interface RawStmtWrapper {
  RawStmt: RawStmt
}

export const processor: Processor = async (str: string) => {
  const lines = str.split('\n');
  const CHUNK_SIZE = 1000; // 1000行ごとに処理
  let partialStmt = ''; // 次のチャンクに持ち越す部分的なステートメント
  const dbStructure: DBStructure = {
    tables: {},
    relationships: {},
  };

  for (let i = 0; i < lines.length; i += CHUNK_SIZE) {
    // 現在のチャンクを作成
    const chunk = lines.slice(i, i + CHUNK_SIZE).join('\n');
    const combined = partialStmt + chunk;

    // セミコロンで末尾を探す
    const lastSemicolonIndex = combined.lastIndexOf(';');
    if (lastSemicolonIndex === -1) {
      // セミコロンがない場合、すべてを次に持ち越し
      partialStmt = combined;
      continue;
    }

    // セミコロンまでの部分を解析対象とし、それ以降を持ち越し
    const parseablePart = combined.slice(0, lastSemicolonIndex + 1);
    partialStmt = combined.slice(lastSemicolonIndex + 1);

    // パース処理
    const parsed = await parse(parseablePart);
    const partialDBStructure = convertToDBStructure(parsed);

    // 結果を統合
    mergeDBStructure(dbStructure, partialDBStructure);

    // メモリ解放を促す
    global.gc?.(); // Node.jsで`--expose-gc`オプションが必要
  }

  // 最後に持ち越した部分を処理
  if (partialStmt.trim()) {
    const parsed = await parse(partialStmt);
    const partialDBStructure = convertToDBStructure(parsed);
    mergeDBStructure(dbStructure, partialDBStructure);
  }

  return dbStructure;
};

// DB構造を統合するための補助関数
const mergeDBStructure = (target: DBStructure, source: DBStructure) => {
  // テーブルを統合
  for (const [tableName, table] of Object.entries(source.tables)) {
    target.tables[tableName] = {
      ...target.tables[tableName],
      ...table,
      columns: {
        ...target.tables[tableName]?.columns,
        ...table.columns,
      },
      indices: {
        ...target.tables[tableName]?.indices,
        ...table.indices,
      },
    };
  }

  // リレーションシップを統合
  for (const [relationshipName, relationship] of Object.entries(source.relationships)) {
    target.relationships[relationshipName] = relationship;
  }
};
