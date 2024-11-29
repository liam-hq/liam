import {
  AssocNode,
  CallNode,
  FalseNode,
  IntegerNode,
  KeywordHashNode,
  type LocalVariableReadNode,
  StatementsNode,
  StringNode,
  type SymbolNode,
  TrueNode,
  Visitor,
  loadPrism,
} from '@ruby/prism'
import type { Column, Columns, DBStructure, Table, Tables } from 'src/schema'
import type { Processor } from '../types.js'

class DBStructureFinder extends Visitor {
  private tables: Table[] = []

  getDBStructure(): DBStructure {
    const dbStructure: DBStructure = {
      tables: this.tables.reduce((acc, table) => {
        acc[table.name] = table
        return acc
      }, {} as Tables),
      relationships: {},
    }
    return dbStructure
  }

  private extractTableName(argNodes: Node[]): string {
    const nameNode = argNodes.find((node) => node instanceof StringNode)
    // @ts-ignore: unescaped is defined as string but it is actually object
    return (nameNode as StringNode).unescaped.value
  }

  private processIdColumn(argNodes: Node[]): Column | null {
    const idKeywordHash = argNodes.find(
      (node) => node instanceof KeywordHashNode,
    )

    const idColumn: Column = {
      name: 'id',
      type: '',
      notNull: true,
      default: null,
      primary: true,
      check: null,
      comment: null,
      unique: false,
      increment: false,
    }

    if (idKeywordHash) {
      const idAssoc = (idKeywordHash as KeywordHashNode).elements.find(
        (elem) =>
          elem instanceof AssocNode &&
          // @ts-ignore: unescaped is defined as string but it is actually object
          (elem.key as SymbolNode).unescaped.value === 'id',
      ) as AssocNode | undefined

      if (idAssoc) {
        // @ts-ignore: unescaped is defined as string but it is actually object
        idColumn.type = (idAssoc.value as SymbolNode).unescaped.value
        return idColumn
      }
    }

    idColumn.type = 'bigserial'
    return idColumn
  }

  private processTableColumns(blockNodes: Node[]): Column[] {
    const columns: Column[] = []

    for (const blockNode of blockNodes) {
      if (blockNode instanceof StatementsNode) {
        for (const node of blockNode.compactChildNodes()) {
          if (
            node instanceof CallNode &&
            (node.receiver as LocalVariableReadNode).name === 't'
          ) {
            // Skip index fields
            if (node.name === 'index') continue

            const column = this.extractColumnDetails(node)
            if (column.name) columns.push(column)
          }
        }
      }
    }

    return columns
  }

  private extractColumnDetails(node: CallNode): Column {
    const column: Column = {
      name: '',
      type: node.name,
      notNull: false,
      default: null,
      check: null,
      comment: null,
      primary: false,
      unique: false,
      increment: false,
    }

    const argNodes = node.arguments_?.compactChildNodes() || []
    for (const argNode of argNodes) {
      if (argNode instanceof StringNode) {
        // @ts-ignore: unescaped is defined as string but it is actually object
        column.name = argNode.unescaped.value
      } else if (argNode instanceof KeywordHashNode) {
        this.processColumnOptions(argNode, column)
      }
    }

    return column
  }

  private processColumnOptions(
    hashNode: KeywordHashNode,
    column: Column,
  ): void {
    for (const argElement of hashNode.elements) {
      // @ts-ignore: unescaped is defined as string but it is actually object
      const key = (argElement as AssocNode).key.unescaped.value
      const value = (argElement as AssocNode).value

      switch (key) {
        case 'null':
          column.notNull = value instanceof FalseNode
          break
        case 'default':
          column.default = this.extractDefaultValue(value)
          break
        case 'unique':
          column.unique = value instanceof TrueNode
          break
      }
    }
  }

  private extractDefaultValue(
    value: TrueNode | FalseNode | StringNode | IntegerNode,
  ): string | number | boolean | null {
    if (value instanceof TrueNode) return true
    if (value instanceof FalseNode) return false
    // @ts-ignore: unescaped is defined as string but it is actually object
    if (value instanceof StringNode) return value.unescaped.value
    // @ts-ignore: IntegerNode actually has value property
    if (value instanceof IntegerNode) return value.value
    return null
  }

  override visitCallNode(node: CallNode): void {
    if (node.name === 'create_table') {
      const argNodes = node.arguments_?.compactChildNodes() || []

      const table: Table = {
        name: this.extractTableName(argNodes as unknown as Node[]),
        columns: {},
        comment: null,
        indices: [],
      }

      const columns: Column[] = []

      const idColumn = this.processIdColumn(argNodes as unknown as Node[])
      if (idColumn) columns.push(idColumn)

      const blockNodes = node.block?.compactChildNodes() || []
      columns.push(...this.processTableColumns(blockNodes as unknown as Node[]))

      table.columns = columns.reduce((acc, column) => {
        acc[column.name] = column
        return acc
      }, {} as Columns)

      this.tables.push(table)
    }

    super.visitCallNode(node)
  }
}

async function parseRubySchema(schemaString: string): Promise<DBStructure> {
  const parse = await loadPrism()
  const tableFinder = new DBStructureFinder()

  const parseResult = parse(schemaString)
  parseResult.value.accept(tableFinder)

  return tableFinder.getDBStructure()
}

export const processor: Processor = async (
  str: string,
): Promise<DBStructure> => {
  return await parseRubySchema(str)
}
