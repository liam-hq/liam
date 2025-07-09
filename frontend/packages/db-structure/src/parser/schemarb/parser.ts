import {
  ArrayNode,
  AssocNode,
  CallNode,
  FalseNode,
  HashNode,
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
import { err, ok, type Result } from 'neverthrow'
import type {
  CheckConstraint,
  Column,
  Columns,
  Constraint,
  Constraints,
  ForeignKeyConstraint,
  ForeignKeyConstraintReferenceOption,
  Index,
  Indexes,
  PrimaryKeyConstraint,
  Schema,
  Table,
  Tables,
  UniqueConstraint,
} from '../../schema/index.js'
import {
  aCheckConstraint,
  aColumn,
  aForeignKeyConstraint,
  anIndex,
  aTable,
} from '../../schema/index.js'
import {
  type ProcessError,
  UnexpectedTokenWarningError,
  WarningError,
} from '../errors.js'
import type { Processor, ProcessResult } from '../types.js'
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
        elem.key.unescaped.value === 'comment',
    )

    if (commentAssoc && commentAssoc instanceof AssocNode) {
      // @ts-expect-error: unescaped is defined as string but it is actually object
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      return commentAssoc.value.unescaped.value
    }
  }
  return null
}

function extractIdColumnAndConstraint(
  argNodes: Node[],
): [Column, PrimaryKeyConstraint] | [null, null] {
  const keywordHash = argNodes.find((node) => node instanceof KeywordHashNode)

  const idColumn = aColumn({
    name: 'id',
    type: '',
    notNull: true,
  })
  const idPrimaryKeyConstraint: PrimaryKeyConstraint = {
    type: 'PRIMARY KEY',
    name: 'PRIMARY_id',
    columnNames: ['id'],
  }

  if (keywordHash) {
    const idAssoc = keywordHash.elements.find(
      (elem) =>
        elem instanceof AssocNode &&
        elem.key instanceof SymbolNode &&
        elem.key.unescaped.value === 'id',
    )

    if (idAssoc && idAssoc instanceof AssocNode) {
      if (idAssoc.value instanceof FalseNode) return [null, null]
      if (
        idAssoc.value instanceof StringNode ||
        idAssoc.value instanceof SymbolNode
      )
        idColumn.type = idAssoc.value.unescaped.value

      return [idColumn, idPrimaryKeyConstraint]
    }
  }

  // Since 5.1 PostgreSQL adapter uses bigserial type for primary key in default
  // See:https://github.com/rails/rails/blob/v8.0.0/activerecord/lib/active_record/migration/compatibility.rb#L377
  idColumn.type = 'bigserial'
  return [idColumn, idPrimaryKeyConstraint]
}

/**
 * Process a call node and extract column, index, or constraint details
 */
function processCallNode(
  node: CallNode,
  columns: Column[],
  indexes: Index[],
  constraints: Constraint[],
  errors: ProcessError[],
): void {
  // Only process nodes with receiver 't'
  if (
    !(
      node.receiver instanceof LocalVariableReadNode &&
      node.receiver.name === 't'
    )
  ) {
    return
  }

  // Process index nodes
  if (node.name === 'index') {
    const index = extractIndexDetails(node)
    indexes.push(index)

    // Add unique constraint if index is unique
    if (index.unique && index.columns.length > 0) {
      const uniqueConstraint: UniqueConstraint = {
        type: 'UNIQUE',
        name: `UNIQUE_${index.columns.join('_')}`,
        columnNames: index.columns,
      }
      constraints.push(uniqueConstraint)
    }
    return
  }

  if (node.name === 'check_constraint') {
    const argNodes = node.arguments_?.compactChildNodes() ?? []
    const result = extractCheckConstraint(argNodes)
    if (result.isErr()) {
      errors.push(result.error)
    } else {
      constraints.push(result.value)
    }

    return
  }

  // Process column nodes
  const result = extractColumnDetails(node)
  if (result.column.name) {
    columns.push(result.column)

    // Handle inline index creation
    if (result.index) {
      const index = result.index
      // Generate default index name if not provided
      if (!index.name) {
        const prefix = index.unique ? 'unique_' : 'index_'
        index.name = `${prefix}${result.column.name}`
      }

      indexes.push(index)

      // Add unique constraint if index is unique
      if (index.unique && result.column.name) {
        const uniqueConstraint: UniqueConstraint = {
          type: 'UNIQUE',
          name: `UNIQUE_${result.column.name}`,
          columnNames: [result.column.name],
        }
        constraints.push(uniqueConstraint)
      }
    }
  }
}

/**
 * Process a statement node and extract details from its child nodes
 */
function processStatementNode(
  statementNode: StatementsNode,
  columns: Column[],
  indexes: Index[],
  constraints: Constraint[],
  errors: ProcessError[],
): void {
  for (const node of statementNode.compactChildNodes()) {
    if (node instanceof CallNode) {
      processCallNode(node, columns, indexes, constraints, errors)
    }
  }
}

/**
 * Extract table details from block nodes
 */
function extractTableDetails(
  blockNodes: Node[],
): [Column[], Index[], Constraint[], ProcessError[]] {
  const columns: Column[] = []
  const indexes: Index[] = []
  const constraints: Constraint[] = []
  const errors: ProcessError[] = []

  // Process each block node
  for (const blockNode of blockNodes) {
    if (blockNode instanceof StatementsNode) {
      processStatementNode(blockNode, columns, indexes, constraints, errors)
    }
  }

  return [columns, indexes, constraints, errors]
}

function extractColumnDetails(node: CallNode): {
  column: Column
  index: Index | null
} {
  const column = aColumn({
    name: '',
    type: convertColumnType(node.name),
  })
  let index: Index | null = null

  const argNodes = node.arguments_?.compactChildNodes() || []
  for (const argNode of argNodes) {
    if (argNode instanceof StringNode) {
      column.name = argNode.unescaped.value
    } else if (argNode instanceof KeywordHashNode) {
      index = extractColumnOptions(argNode, column)
    }
  }

  // Set index column name if index was created
  if (index && column.name) {
    index.columns = [column.name]
  }

  return { column, index }
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
          index.columns.push(argElem.unescaped.value)
        }
      }
    } else if (argNode instanceof KeywordHashNode) {
      extractIndexOptions(argNode, index)
    }
  }

  return index
}

function extractColumnOptions(
  hashNode: KeywordHashNode,
  column: Column,
): Index | null {
  let index: Index | null = null

  for (const argElement of hashNode.elements) {
    if (!(argElement instanceof AssocNode)) continue
    // @ts-expect-error: unescaped is defined as string but it is actually object
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const key = argElement.key.unescaped.value
    const value = argElement.value

    switch (key) {
      case 'null':
        column.notNull = value instanceof FalseNode
        break
      case 'default':
        if (
          value instanceof TrueNode ||
          value instanceof FalseNode ||
          value instanceof StringNode ||
          value instanceof IntegerNode
        ) {
          column.default = extractDefaultValue(value)
        }
        break
      case 'unique':
        // Handle unique constraint creation in processCallNode instead
        break
      case 'comment':
        // @ts-expect-error: unescaped is defined as string but it is actually object
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        column.comment = value.unescaped.value
        break
      case 'index':
        // Handle inline index syntax
        index = extractInlineIndexOptions(value, column.name)
        break
    }
  }

  return index
}

/**
 * Extract inline index options from column definition
 */
function extractInlineIndexOptions(
  value: Node,
  columnName: string,
): Index | null {
  const index = anIndex({
    name: '',
    unique: false,
    columns: [columnName],
    type: '',
  })

  if (value instanceof TrueNode) {
    // Simple index: index: true
    return index
  }

  if (value instanceof KeywordHashNode || value instanceof HashNode) {
    // Hash options: index: { unique: true, name: "custom_name" }
    for (const argElement of value.elements) {
      if (!(argElement instanceof AssocNode)) continue
      // @ts-expect-error: unescaped is defined as string but it is actually object
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const key = argElement.key.unescaped.value
      const optionValue = argElement.value

      switch (key) {
        case 'unique':
          index.unique = optionValue instanceof TrueNode
          break
        case 'name':
          if (
            optionValue instanceof StringNode ||
            optionValue instanceof SymbolNode
          ) {
            index.name = optionValue.unescaped.value
          }
          break
        case 'using':
          if (
            optionValue instanceof StringNode ||
            optionValue instanceof SymbolNode
          ) {
            index.type = optionValue.unescaped.value
          }
          break
      }
    }
    return index
  }

  return null
}

function extractIndexOptions(hashNode: KeywordHashNode, index: Index): void {
  for (const argElement of hashNode.elements) {
    if (!(argElement instanceof AssocNode)) continue
    // @ts-expect-error: unescaped is defined as string but it is actually object
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const key = argElement.key.unescaped.value
    const value = argElement.value

    switch (key) {
      case 'name':
        // @ts-expect-error: unescaped is defined as string but it is actually object
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        index.name = value.unescaped.value
        break
      case 'unique':
        index.unique = value instanceof TrueNode
        break
      case 'using':
        // @ts-expect-error: unescaped is defined as string but it is actually object
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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
  if (value instanceof StringNode) return value.unescaped.value
  if (value instanceof IntegerNode) return value.value
  return null
}

function extractForeignKeyTableNames(
  argNodes: Node[],
): Result<[string, string], UnexpectedTokenWarningError> {
  const stringNodes = argNodes.filter((node) => node instanceof StringNode)
  if (stringNodes.length !== 2) {
    return err(
      new UnexpectedTokenWarningError('Foreign key must have two table names'),
    )
  }

  const [foreignTableName, primaryTableName] = stringNodes.map(
    (node): string => {
      if (node instanceof StringNode) return node.unescaped.value
      return ''
    },
  ) as [string, string]

  return ok([primaryTableName, foreignTableName])
}

/**
 * Extract string values from nodes
 */
function extractStringValues(
  nodes: Node[],
): Result<string[], UnexpectedTokenWarningError> {
  const stringNodes = nodes.filter((node) => node instanceof StringNode)

  const values = stringNodes.map((node): string => {
    if (node instanceof StringNode) return node.unescaped.value
    return ''
  })

  return ok(values)
}

/**
 * Extract constraint name from options
 */
function extractConstraintName(node: KeywordHashNode): string | null {
  for (const argElement of node.elements) {
    if (!(argElement instanceof AssocNode)) continue

    // @ts-expect-error: unescaped is defined as string but it is actually object
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const key = argElement.key.unescaped.value
    const value = argElement.value

    if (
      key === 'name' &&
      (value instanceof StringNode || value instanceof SymbolNode)
    ) {
      return value.unescaped.value
    }
  }

  return null
}

/**
 * Extract check constraint details
 */
function extractCheckConstraint(
  argNodes: Node[],
): Result<CheckConstraint, UnexpectedTokenWarningError> {
  // Extract string values (table name and constraint detail)
  const stringValuesResult = extractStringValues(argNodes)
  if (stringValuesResult.isErr()) {
    return err(stringValuesResult.error)
  }

  const stringValues = stringValuesResult.value
  if (stringValues.length !== 1) {
    return err(
      new UnexpectedTokenWarningError(
        'Check constraint must have one string of its detail',
      ),
    )
  }

  const [detail] = stringValues as [string]

  // Create constraint with detail
  const constraint = aCheckConstraint({ detail })

  // Extract constraint name from options if present
  for (const node of argNodes) {
    if (node instanceof KeywordHashNode) {
      const name = extractConstraintName(node)
      if (name) {
        constraint.name = name
      }
    }
  }

  return ok(constraint)
}

/**
 * Extract check constraint details
 */
function extractCheckConstraintWithTableName(
  argNodes: Node[],
): Result<
  { tableName: string; constraint: CheckConstraint },
  UnexpectedTokenWarningError
> {
  // Extract string values (table name and constraint detail)
  const stringValuesResult = extractStringValues(argNodes)
  if (stringValuesResult.isErr()) {
    return err(stringValuesResult.error)
  }

  const stringValues = stringValuesResult.value
  if (stringValues.length !== 2) {
    return err(
      new UnexpectedTokenWarningError(
        'Check constraint must have one table name and its detail',
      ),
    )
  }

  const [tableName, detail] = stringValues as [string, string]

  // Create constraint with detail
  const constraint = aCheckConstraint({
    detail,
  })

  // Extract constraint name from options if present
  for (const node of argNodes) {
    if (node instanceof KeywordHashNode) {
      const name = extractConstraintName(node)
      if (name) {
        constraint.name = name
      }
    }
  }

  return ok({ tableName, constraint })
}

function normalizeConstraintName(
  constraint: string,
): ForeignKeyConstraintReferenceOption {
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

/**
 * Process a single option for a foreign key
 */
function processForeignKeyOption(
  key: string,
  value: Node,
  foreignKeyConstraint: ForeignKeyConstraint,
): void {
  switch (key) {
    case 'column':
      if (value instanceof StringNode || value instanceof SymbolNode) {
        foreignKeyConstraint.columnName = value.unescaped.value
      }
      break
    case 'name':
      if (value instanceof StringNode || value instanceof SymbolNode) {
        foreignKeyConstraint.name = value.unescaped.value
      }
      break
    case 'on_update':
      if (value instanceof SymbolNode) {
        const updateConstraint = normalizeConstraintName(value.unescaped.value)
        foreignKeyConstraint.updateConstraint = updateConstraint
      }
      break
    case 'on_delete':
      if (value instanceof SymbolNode) {
        const deleteConstraint = normalizeConstraintName(value.unescaped.value)
        foreignKeyConstraint.deleteConstraint = deleteConstraint
      }
      break
  }
}

/**
 * Process options from a keyword hash node
 */
function processKeywordHashNode(
  hashNode: KeywordHashNode,
  foreignKeyConstraint: ForeignKeyConstraint,
): void {
  for (const argElement of hashNode.elements) {
    if (!(argElement instanceof AssocNode)) continue

    // @ts-expect-error: unescaped is defined as string but it is actually object
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const key = argElement.key.unescaped.value
    const value = argElement.value

    processForeignKeyOption(key, value, foreignKeyConstraint)
  }
}

/**
 * Set default values for foreign key options
 */
function setDefaultForeignKeyValues(
  foreignKeyConstraint: ForeignKeyConstraint,
  foreignTableName: string,
  primaryTableName: string,
): void {
  // ref: https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/SchemaStatements.html#method-i-add_foreign_key
  if (foreignKeyConstraint.columnName === '') {
    const columnName = `${singularize(primaryTableName)}_id`
    foreignKeyConstraint.columnName = columnName
  }

  if (foreignKeyConstraint.name === '') {
    foreignKeyConstraint.name = `fk_${foreignTableName}_${foreignKeyConstraint.columnName}`
  }
}

/**
 * Extract foreign key options from argument nodes
 */
function extractForeignKeyOptions(
  argNodes: Node[],
  foreignKeyConstraint: ForeignKeyConstraint,
  foreignTableName: string,
  primaryTableName: string,
): void {
  // Process options from keyword hash nodes
  for (const argNode of argNodes) {
    if (argNode instanceof KeywordHashNode) {
      processKeywordHashNode(argNode, foreignKeyConstraint)
    }
  }

  // Set default values for any unspecified options
  setDefaultForeignKeyValues(
    foreignKeyConstraint,
    foreignTableName,
    primaryTableName,
  )
}

class SchemaFinder extends Visitor {
  private tables: Table[] = []
  private errors: ProcessError[] = []

  getSchema(): Schema {
    const schema: Schema = {
      tables: this.tables.reduce((acc, table) => {
        acc[table.name] = table
        return acc
      }, {} as Tables),
    }
    return schema
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
    const constraints: Constraint[] = []

    const [idColumn, idConstraint] = extractIdColumnAndConstraint(argNodes)
    if (idColumn) {
      columns.push(idColumn)
      constraints.push(idConstraint)
    }

    const blockNodes = node.block?.compactChildNodes() || []
    const [extractColumns, extractIndexes, extractConstraints, extractErrors] =
      extractTableDetails(blockNodes)

    columns.push(...extractColumns)
    indexes.push(...extractIndexes)
    constraints.push(...extractConstraints)
    this.errors.push(...extractErrors)

    table.columns = columns.reduce((acc, column) => {
      acc[column.name] = column
      return acc
    }, {} as Columns)

    table.indexes = indexes.reduce((acc, index) => {
      acc[index.name] = index
      return acc
    }, {} as Indexes)

    table.constraints = constraints.reduce((acc, constraint) => {
      acc[constraint.name] = constraint
      return acc
    }, {} as Constraints)

    this.tables.push(table)
  }

  handleAddForeignKey(node: CallNode): void {
    const argNodes = node.arguments_?.compactChildNodes() || []

    const namesResult = extractForeignKeyTableNames(argNodes)
    if (namesResult.isErr()) {
      this.errors.push(namesResult.error)
      return
    }
    const [primaryTableName, foreignTableName] = namesResult.value

    const foreignKeyConstraint = aForeignKeyConstraint({
      targetTableName: primaryTableName,
      targetColumnName: 'id',
    })

    extractForeignKeyOptions(
      argNodes,
      foreignKeyConstraint,
      foreignTableName,
      primaryTableName,
    )

    const foreignTable = this.tables.find(
      (table) => table.name === foreignTableName,
    )
    if (foreignTable) {
      foreignTable.constraints[foreignKeyConstraint.name] = foreignKeyConstraint
    }
  }

  handleAddCheckConstraint(node: CallNode): void {
    const argNodes = node.arguments_?.compactChildNodes() || []

    const constraintResult = extractCheckConstraintWithTableName(argNodes)
    if (constraintResult.isErr()) {
      this.errors.push(constraintResult.error)
      return
    }
    const { tableName, constraint } = constraintResult.value
    const table = this.tables.find((table) => table.name === tableName)
    if (table) {
      table.constraints[constraint.name] = constraint
    }
  }

  override visitCallNode(node: CallNode): void {
    if (node.name === 'create_table') this.handleCreateTable(node)
    if (node.name === 'add_foreign_key') this.handleAddForeignKey(node)
    if (node.name === 'add_check_constraint')
      this.handleAddCheckConstraint(node)

    super.visitCallNode(node)
  }
}

async function parseRubySchema(schemaString: string): Promise<ProcessResult> {
  const parse = await loadPrism()
  const schemaFinder = new SchemaFinder()

  const parseResult = parse(schemaString)
  parseResult.value.accept(schemaFinder)

  return {
    value: schemaFinder.getSchema(),
    errors: schemaFinder.getErrors(),
  }
}

export const processor: Processor = (str) => parseRubySchema(str)
