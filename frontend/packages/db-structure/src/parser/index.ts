import type { DBStructure, Table } from 'src/schema'
import { schemaRbParser } from './schemarb'

type SupportedFormat = 'schemarb' | 'postgres'

// biome-ignore lint/suspicious/noExplicitAny: TODO: Generate types with pegjs
const convertToDBStructure = (data: any): DBStructure => {
  return {
    // biome-ignore lint/suspicious/noExplicitAny: TODO: Generate types with pegjs
    tables: data.tables.reduce((acc: Record<string, Table>, table: any) => {
      acc[table.name] = {
        comment: null,
        // biome-ignore lint/suspicious/noExplicitAny: TODO: Generate types with pegjs
        fields: table.fields.map((field: any) => ({
          check: null,
          comment: null,
          default: 'default' in field ? field.default : null,
          increment: false,
          name: field.name,
          notNull: 'nullable' in field ? !field.nullable : null,
          primary: false,
          type: field.type.type_name,
          unique: false,
        })),
        indices: [],
        name: table.name,
        x: 0,
        y: 0,
        color: null,
      }
      return acc
    }, {}),
    relationships: {},
  }
}

// biome-ignore lint/suspicious/noExplicitAny: TODO: Generate types with pegjs
const selectParser = (format: SupportedFormat): any => {
  switch (format) {
    case 'schemarb':
      return schemaRbParser
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
}

export const parse = (str: string, format: SupportedFormat): DBStructure => {
  try {
    const parser = selectParser(format)
    const parsedSchema = parser.parse(str)
    const dbStructure = convertToDBStructure(parsedSchema)
    return dbStructure
  } catch (_error) {
    throw new Error('Failed to parse schema')
  }
}