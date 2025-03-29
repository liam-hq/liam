import {
  ArrayNode,
  AssocNode,
  CallNode,
  FalseNode,
  IntegerNode,
  KeywordHashNode,
  LocalVariableReadNode,
  type Node,
  StatementsNode,
  StringNode,
  SymbolNode,
  TrueNode,
  Visitor,
} from '@ruby/prism'
import { type Result, err, ok } from 'neverthrow'
import type {
  Column,
  Columns,
  DBStructure,
  ForeignKeyConstraint,
  Index,
  Indexes,
  Relationship,
  Table,
  Tables,
} from '../../schema/index.js'
import { aColumn, aRelationship, aTable, anIndex } from '../../schema/index.js'
import {
  type ProcessError,
  UnexpectedTokenWarningError,
  WarningError,
} from '../errors.js'
import type { ProcessResult, Processor } from '../types.js'
import {
  defaultRelationshipName,
  handleOneToOneRelationships,
} from '../utils/index.js'
import { convertColumnType } from './convertColumnType.js'
import { loadPrism } from './loadPrism.js'
import { singularize } from './singularize.js'

export class UnsupportedTokenError extends WarningError {
  constructor(message: string) {
    super(message)
    this.name = 'UnsupportedTokenError'
  }
}

function extractTableName(
  argNodes: Node[],
): Result<string, UnsupportedTokenError> {
  const nameNode = argNodes.find((node) => node instanceof StringNode)
  if (!nameNode) {
    return err(
      new UnsupportedTokenError(
        'Expected a string for the table name, but received different data',
      ),
    )
  }

  // @ts-expect-error: unescaped is defined as string but it is actually object
  const value = nameNode.unescaped.value

  return ok(value)
}

function extractTableComment(argNodes: Node[]): string | null {
  const keywordHash = argNodes.find((node) => node instanceof KeywordHashNode)

  if (keywordHash) {
    const commentAssoc = keywordHash.elements.find(
      (elem) =>
        elem instanceof AssocNode &&
        elem.key instanceof SymbolNode &&
        // @ts-expect-error: unescaped is defined as string but it is actually object
        elem.key.unescaped.value === 'comment',
    )

    if (commentAssoc && commentAssoc instanceof AssocNode) {
      // @ts-expect-error: unescaped is defined as string but it is actually object
      return commentAssoc.value.unescaped.value
    }
  }
  return null
}

function extractIdColumn(argNodes: Node[]): Column | null {
  const keywordHash = argNodes.find((node) => node instanceof KeywordHashNode)

  const idColumn = aColumn({
    name: 'id',
    type: '',
    notNull: true,
    primary: true,
    unique: true,
  })

  if (keywordHash) {
    const idAssoc = keywordHash.elements.find(
      (elem) =>
        elem instanceof AssocNode &&
        elem.key instanceof SymbolNode &&
        // @ts-expect-error: unescaped is defined as string but it is actually object
        elem.key.unescaped.value === 'id',
    )

    if (idAssoc && idAssoc instanceof AssocNode) {
      if (idAssoc.value instanceof FalseNode) return null
      if (
        idAssoc.value instanceof StringNode ||
        idAssoc.value instanceof SymbolNode
      )
        // @ts-expect-error: unescaped is defined as string but it is actually object
        idColumn.type = idAssoc.value.unescaped.value

      return idColumn
    }
  }

  // Since 5.1 PostgreSQL adapter uses bigserial type for primary key in default
  // See:https://github.com/rails/rails/blob/v8.0.0/activerecord/lib/active_record/migration/compatibility.rb#L377
  idColumn.type = 'bigserial'
  return idColumn
}

function extractTableDetails(blockNodes: Node[]): [Column[], Index[]] {
  const columns: Column[] = []
  const indexes: Index[] = []

  for (const blockNode of blockNodes) {
    if (blockNode instanceof StatementsNode) {
      for (const node of blockNode.compactChildNodes()) {
        if (
          node instanceof CallNode &&
          node.receiver instanceof LocalVariableReadNode &&
          node.receiver.name === 't'
        ) {
          if (node.name === 'index') {
            const index = extractIndexDetails(node)
            indexes.push(index)
            continue
          }

          const column = extractColumnDetails(node)
          if (column.name) columns.push(column)
        }
      }
    }
  }

  return [columns, indexes]
}

function extractColumnDetails(node: CallNode): Column {
  const column = aColumn({
    name: '',
    type: convertColumnType(node.name),
  })

  const argNodes = node.arguments_?.compactChildNodes() || []
  for (const argNode of argNodes) {
    if (argNode instanceof StringNode) {
      // @ts-expect-error: unescaped is defined as string but it is actually object
      column.name = argNode.unescaped.value
    } else if (argNode instanceof KeywordHashNode) {
      extractColumnOptions(argNode, column)
    }
  }

  return column
}

function extractIndexDetails(node: CallNode): Index {
  const index = anIndex({
    name: '',
    unique: false,
    columns: [],
    type: '',
  })

  const argNodes = node.arguments_?.compactChildNodes() || []
  for (const argNode of argNodes) {
    if (argNode instanceof ArrayNode) {
      const argElemens = argNode.compactChildNodes()
      for (const argElem of argElemens) {
        if (argElem instanceof StringNode) {
          // @ts-expect-error: unescaped is defined as string but it is actually object
          index.columns.push(argElem.unescaped.value)
        }
      }
    } else if (argNode instanceof KeywordHashNode) {
      extractIndexOptions(argNode, index)
    }
  }

  return index
}

function extractColumnOptions(hashNode: KeywordHashNode, column: Column): void {
  for (const argElement of hashNode.elements) {
    if (!(argElement instanceof AssocNode)) continue
    // @ts-expect-error: unescaped is defined as string but it is actually object
    const key = argElement.key.unescaped.value
    const value = argElement.value

    switch (key) {
      case 'null':
        column.notNull = value instanceof FalseNode
        break
      case 'default':
        column.default = extractDefaultValue(value)
        break
      case 'unique':
        column.unique = value instanceof TrueNode
        break
      case 'comment':
        // @ts-expect-error: unescaped is defined as string but it is actually object
        column.comment = value.unescaped.value
        break
    }
  }
}

function extractIndexOptions(hashNode: KeywordHashNode, index: Index): void {
  for (const argElement of hashNode.elements) {
    if (!(argElement instanceof AssocNode)) continue
    // @ts-expect-error: unescaped is defined as string but it is actually object
    const key = argElement.key.unescaped.value
    const value = argElement.value

    switch (key) {
      case 'name':
        // @ts-expect-error: unescaped is defined as string but it is actually object
        index.name = value.unescaped.value
        break
      case 'unique':
        index.unique = value instanceof TrueNode
        break
      case 'using':
        // @ts-expect-error: unescaped is defined as string but it is actually object
        index.type = value.unescaped.value
        break
    }
  }
}

function extractDefaultValue(
  value: TrueNode | FalseNode | StringNode | IntegerNode,
): string | number | boolean | null {
  if (value instanceof TrueNode) return true
  if (value instanceof FalseNode) return false
  // @ts-expect-error: unescaped is defined as string but it is actually object
  if (value instanceof StringNode) return value.unescaped.value
  // @ts-expect-error: IntegerNode actually has value property
  if (value instanceof IntegerNode) return value.value
  return null
}

function extractRelationshipTableNames(
  argNodes: Node[],
): Result<[string, string], UnexpectedTokenWarningError> {
  const stringNodes = argNodes.filter((node) => node instanceof StringNode)
  if (stringNodes.length !== 2) {
    return err(
      new UnexpectedTokenWarningError(
        'Foreign key relationship must have two table names',
      ),
    )
  }

  const [foreignTableName, primaryTableName] = stringNodes.map(
    (node): string => {
      // @ts-expect-error: unescaped is defined as string but it is actually object
      if (node instanceof StringNode) return node.unescaped.value
      return ''
    },
  ) as [string, string]

  return ok([primaryTableName, foreignTableName])
}

function normalizeConstraintName(constraint: string): ForeignKeyConstraint {
  // Valid values are :nullify, :cascade, and :restrict
  // https://github.com/rails/rails/blob/v8.0.0/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb#L1161-L1164
  switch (constraint) {
    case 'cascade':
      return 'CASCADE'
    case 'restrict':
      return 'RESTRICT'
    case 'nullify':
      return 'SET_NULL'
    default:
      return 'NO_ACTION'
  }
}

function extractForeignKeyOptions(
  argNodes: Node[],
  relation: Relationship,
): void {
  for (const argNode of argNodes) {
    if (argNode instanceof KeywordHashNode) {
      for (const argElement of argNode.elements) {
        if (!(argElement instanceof AssocNode)) continue
        // @ts-expect-error: unescaped is defined as string but it is actually object
        const key = argElement.key.unescaped.value
        const value = argElement.value

        switch (key) {
          case 'column':
            if (value instanceof StringNode || value instanceof SymbolNode) {
              // @ts-expect-error: unescaped is defined as string but it is actually object
              relation.foreignColumnName = value.unescaped.value
            }
            break
          case 'name':
            if (value instanceof StringNode || value instanceof SymbolNode) {
              // @ts-expect-error: unescaped is defined as string but it is actually object
              relation.name = value.unescaped.value
            }
            break
          case 'on_update':
            if (value instanceof SymbolNode) {
              relation.updateConstraint = normalizeConstraintName(
                // @ts-expect-error: unescaped is defined as string but it is actually object
                value.unescaped.value,
              )
            }
            break
          case 'on_delete':
            if (value instanceof SymbolNode) {
              relation.deleteConstraint = normalizeConstraintName(
                // @ts-expect-error: unescaped is defined as string but it is actually object
                value.unescaped.value,
              )
            }
            break
        }
      }
    }
  }

  // ref: https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/SchemaStatements.html#method-i-add_foreign_key
  if (relation.foreignColumnName === '') {
    relation.foreignColumnName = `${singularize(relation.primaryTableName)}_id`
  }

  if (relation.name === '') {
    relation.name = defaultRelationshipName(
      relation.primaryTableName,
      relation.primaryColumnName,
      relation.foreignTableName,
      relation.foreignColumnName,
    )
  }
}

class DBStructureFinder extends Visitor {
  private tables: Table[] = []
  private relationships: Relationship[] = []
  private errors: ProcessError[] = []

  getDBStructure(): DBStructure {
    const dbStructure: DBStructure = {
      tables: this.tables.reduce((acc, table) => {
        acc[table.name] = table
        return acc
      }, {} as Tables),
      relationships: this.relationships.reduce(
        (acc, relationship) => {
          acc[relationship.name] = relationship
          return acc
        },
        {} as Record<string, Relationship>,
      ),
    }
    handleOneToOneRelationships(dbStructure.tables, dbStructure.relationships)
    return dbStructure
  }

  getErrors(): ProcessError[] {
    return this.errors
  }

  handleCreateTable(node: CallNode): void {
    const argNodes = node.arguments_?.compactChildNodes() || []
    const nameResult = extractTableName(argNodes)
    if (nameResult.isErr()) {
      this.errors.push(nameResult.error)
      return
    }

    const table = aTable({
      name: nameResult.value,
    })

    table.comment = extractTableComment(argNodes)

    const columns: Column[] = []
    const indexes: Index[] = []

    const idColumn = extractIdColumn(argNodes)
    if (idColumn) columns.push(idColumn)

    const blockNodes = node.block?.compactChildNodes() || []
    const [extractColumns, extractIndexes] = extractTableDetails(blockNodes)

    columns.push(...extractColumns)
    indexes.push(...extractIndexes)

    table.columns = columns.reduce((acc, column) => {
      acc[column.name] = column
      return acc
    }, {} as Columns)

    table.indexes = indexes.reduce((acc, index) => {
      acc[index.name] = index
      return acc
    }, {} as Indexes)

    this.tables.push(table)
  }

  handleAddForeignKey(node: CallNode): void {
    const argNodes = node.arguments_?.compactChildNodes() || []

    const namesResult = extractRelationshipTableNames(argNodes)
    if (namesResult.isErr()) {
      this.errors.push(namesResult.error)
      return
    }
    const [primaryTableName, foreignTableName] = namesResult.value

    const relationship = aRelationship({
      primaryTableName: primaryTableName,
      // TODO: This is a guess, we should add a way to specify the primary column name
      primaryColumnName: 'id',
      foreignTableName: foreignTableName,
    })

    extractForeignKeyOptions(argNodes, relationship)

    this.relationships.push(relationship)
  }

  override visitCallNode(node: CallNode): void {
    if (node.name === 'create_table') this.handleCreateTable(node)
    if (node.name === 'add_foreign_key') this.handleAddForeignKey(node)

    super.visitCallNode(node)
  }
}

async function parseRubySchema(schemaString: string): Promise<ProcessResult> {
  const parse = await loadPrism()
  const tableFinder = new DBStructureFinder()

  const parseResult = parse(schemaString)
  parseResult.value.accept(tableFinder)

  return {
    value: tableFinder.getDBStructure(),
    errors: tableFinder.getErrors(),
  }
}

export const processor: Processor = (str) => parseRubySchema(str)
