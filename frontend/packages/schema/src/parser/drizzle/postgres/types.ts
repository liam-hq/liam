/**
 * Type definitions for Drizzle ORM schema parsing
 */

export type DrizzleTableDefinition = {
  name: string
  columns: Record<string, DrizzleColumnDefinition>
  indexes: Record<string, DrizzleIndexDefinition>
  compositePrimaryKey?: CompositePrimaryKeyDefinition
  comment?: string | undefined
}

export type DrizzleColumnDefinition = {
  name: string
  type: string
  typeOptions?: Record<string, unknown>
  notNull: boolean
  primaryKey: boolean
  unique: boolean
  default?: unknown
  comment?: string | undefined
  references?:
    | {
        table: string
        column: string
        onDelete?: string | undefined
        onUpdate?: string | undefined
      }
    | undefined
}

export type DrizzleIndexDefinition = {
  name: string
  columns: string[]
  unique: boolean
  type?: string
}

export type DrizzleEnumDefinition = {
  name: string
  values: string[]
}

export type CompositePrimaryKeyDefinition = {
  type: 'primaryKey'
  columns: string[]
}

/**
 * Type guard to check if a value is an object
 */
export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

/**
 * Safe property checker without type casting
 */
export const hasProperty = <K extends string>(
  obj: unknown,
  key: K,
): obj is Record<K, unknown> => {
  return typeof obj === 'object' && obj !== null && key in obj
}

/**
 * Safe property getter without type casting
 */
export const getPropertyValue = (obj: unknown, key: string): unknown => {
  if (hasProperty(obj, key)) {
    return obj[key]
  }
  return undefined
}

/**
 * Type guard for CompositePrimaryKeyDefinition
 */
export const isCompositePrimaryKey = (
  value: unknown,
): value is CompositePrimaryKeyDefinition => {
  return (
    isObject(value) &&
    getPropertyValue(value, 'type') === 'primaryKey' &&
    hasProperty(value, 'columns') &&
    Array.isArray(getPropertyValue(value, 'columns'))
  )
}

/**
 * Type guard for DrizzleIndexDefinition
 */
export const isDrizzleIndex = (
  value: unknown,
): value is DrizzleIndexDefinition => {
  return (
    isObject(value) &&
    hasProperty(value, 'name') &&
    hasProperty(value, 'columns') &&
    hasProperty(value, 'unique')
  )
}
