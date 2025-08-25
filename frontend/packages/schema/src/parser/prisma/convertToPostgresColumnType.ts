import type { DMMF } from '@prisma/generator-helper'

// Helper function to handle autoincrement types
function getAutoincrementType(typeName: string): string {
  switch (typeName) {
    case 'Int':
      return 'serial'
    case 'SmallInt':
      return 'smallserial'
    case 'BigInt':
      return 'bigserial'
    default:
      return typeName.toLowerCase()
  }
}

// Helper function to handle native types
function handleNativeType(
  nativeTypeName: string,
  nativeTypeArgs: readonly string[],
  defaultValue: DMMF.Field['default'] | null,
): string {
  // Check for autoincrement
  if (
    typeof defaultValue === 'string' &&
    defaultValue.includes('autoincrement()')
  ) {
    return getAutoincrementType(nativeTypeName)
  }

  // Handle type with arguments
  if (nativeTypeArgs.length > 0) {
    return `${nativeTypeName.toLowerCase()}(${nativeTypeArgs.join(',')})`
  }

  // Special case for DoublePrecision
  if (nativeTypeName === 'DoublePrecision') {
    return 'double precision'
  }

  return nativeTypeName.toLowerCase()
}

// Helper function to map Prisma types to PostgreSQL types
function mapPrismaTypeToPostgres(type: string): string {
  switch (type) {
    case 'String':
      return 'text'
    case 'Boolean':
      return 'boolean'
    case 'Int':
      return 'integer'
    case 'BigInt':
      return 'bigint'
    case 'Float':
      return 'double precision'
    case 'DateTime':
      return 'timestamp(3)'
    case 'Json':
      return 'jsonb'
    case 'Decimal':
      return 'decimal(65,30)'
    case 'Bytes':
      return 'bytea'
    default:
      return type
  }
}

// ref: https://www.prisma.io/docs/orm/reference/prisma-schema-reference#model-field-scalar-types
export function convertToPostgresColumnType(
  type: string,
  nativeType: DMMF.Field['nativeType'],
  defaultValue: DMMF.Field['default'] | null,
): string {
  // If native type is provided, use it
  if (nativeType) {
    const [nativeTypeName, nativeTypeArgs] = nativeType
    return handleNativeType(nativeTypeName, nativeTypeArgs, defaultValue)
  }

  // Handle autoincrement without native type
  if (
    typeof defaultValue === 'string' &&
    defaultValue.includes('autoincrement()')
  ) {
    return getAutoincrementType(type)
  }

  // Special case for uuid default value
  if (typeof defaultValue === 'string' && defaultValue.includes('uuid')) {
    return 'uuid'
  }

  // Map Prisma type to PostgreSQL type
  return mapPrismaTypeToPostgres(type)
}
