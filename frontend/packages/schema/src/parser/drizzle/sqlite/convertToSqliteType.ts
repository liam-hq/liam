/**
 * Convert Drizzle column types to SQLite column types
 * ref: https://orm.drizzle.team/docs/column-types/sqlite
 */
export const convertDrizzleTypeToSqliteType = (
  drizzleType: string,
  options?: Record<string, unknown>,
): string => {
  switch (drizzleType) {
    // text options other than length (e.g., { enum: [...] }, { mode: 'json' })
    // do not change the underlying SQLite type
    case 'text':
      if (options?.['length']) {
        return `text(${options['length']})`
      }
      return 'text'

    // Default case: return type name as-is (integer, real, blob, numeric)
    default:
      return drizzleType
  }
}

/**
 * Convert default values from Drizzle to SQLite format
 */
export const convertDefaultValue = (
  value: unknown,
): string | number | boolean | null => {
  if (value === undefined || value === null) {
    return null
  }

  if (value === 'autoincrement') {
    return 'autoincrement()'
  }

  // Handle primitive values
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value
  }

  return null
}

/**
 * Convert constraint reference options from Drizzle to SQLite format
 */
export const convertReferenceOption = (
  option: string,
): 'CASCADE' | 'RESTRICT' | 'SET_NULL' | 'SET_DEFAULT' | 'NO_ACTION' => {
  switch (option.toLowerCase()) {
    case 'cascade':
      return 'CASCADE'
    case 'restrict':
      return 'RESTRICT'
    case 'setnull':
    case 'set null':
      return 'SET_NULL'
    case 'setdefault':
    case 'set default':
      return 'SET_DEFAULT'
    default:
      return 'NO_ACTION'
  }
}
