/**
 * Convert Drizzle column types to MySQL column types
 * ref: https://orm.drizzle.team/docs/column-types/mysql
 */
export const convertDrizzleTypeToMysqlType = (
  drizzleType: string,
  options?: Record<string, unknown>,
): string => {
  switch (drizzleType) {
    // String types with length options
    case 'varchar':
      if (options?.['length']) {
        return `varchar(${options['length']})`
      }
      return 'varchar'
    case 'char':
      if (options?.['length']) {
        return `char(${options['length']})`
      }
      return 'char'

    // Numeric types with precision/scale
    case 'decimal':
    case 'numeric':
      if (options?.['precision'] && options?.['scale']) {
        return `decimal(${options['precision']},${options['scale']})`
      }
      if (options?.['precision']) {
        return `decimal(${options['precision']})`
      }
      return 'decimal'

    // Enum type - handled as is
    case 'mysqlEnum':
      return 'enum'

    // Serial type (PostgreSQL compatibility in MySQL context)
    case 'serial':
      return 'int'

    // Default case: return type name as-is (works for most standard MySQL types)
    default:
      return drizzleType
  }
}

/**
 * Convert default values from Drizzle to MySQL format
 */
export const convertDefaultValue = (
  value: unknown,
  _drizzleType: string,
): string | number | boolean | null => {
  if (value === undefined || value === null) {
    return null
  }

  // Handle function calls like defaultNow(), autoincrement()
  if (typeof value === 'string') {
    if (value === 'defaultNow' || value === 'now()') {
      return 'now()'
    }
    if (value === 'autoincrement' || value === 'autoincrement()') {
      return 'autoincrement()'
    }
    if (value === 'defaultRandom') {
      // Note: MySQL's UUID() generates UUID v1 (time-based), not truly random like PostgreSQL's gen_random_uuid()
      return 'UUID()'
    }
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
 * Convert constraint reference options from Drizzle to MySQL format
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
