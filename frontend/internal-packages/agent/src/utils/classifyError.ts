/**
 * Error classification utilities for PostgreSQL errors
 *
 * Classifies errors into schema problems (DB Agent should fix)
 * and SQL quality problems (QA Agent should fix)
 *
 * @see https://www.postgresql.org/docs/current/errcodes-appendix.html
 */

/**
 * Error category classification
 */
export type ErrorCategory = 'schema' | 'sql_quality' | 'unknown'

/**
 * Detailed error classification result
 */
export type ErrorClassification = {
  category: ErrorCategory
  errorCode?: string
  errorName?: string
  description: string
  shouldRetryWithSchemaFix: boolean
}

/**
 * PostgreSQL error codes mapping
 * Organized by error category for classification
 */
export const POSTGRES_ERROR_CODES = {
  // Schema problems - DB Agent should fix these
  schema: {
    // Class 23 - Integrity Constraint Violation
    '23502': {
      name: 'not_null_violation',
      description: 'NOT NULL constraint violated - column requires a value',
    },
    '23503': {
      name: 'foreign_key_violation',
      description:
        'Foreign key constraint violated - referenced row does not exist',
    },
    '23505': {
      name: 'unique_violation',
      description: 'UNIQUE constraint violated - duplicate value',
    },
    '23514': {
      name: 'check_violation',
      description: 'CHECK constraint violated - value does not meet condition',
    },
    // Class 42 - Syntax Error or Access Rule Violation (schema-related)
    '42P01': {
      name: 'undefined_table',
      description: 'Table does not exist in the schema',
    },
    '42703': {
      name: 'undefined_column',
      description: 'Column does not exist in the table',
    },
    '42P02': {
      name: 'undefined_parameter',
      description: 'Parameter does not exist',
    },
    '42704': {
      name: 'undefined_object',
      description: 'Database object does not exist',
    },
    '42710': {
      name: 'duplicate_object',
      description: 'Object name already exists',
    },
    '42712': {
      name: 'duplicate_alias',
      description: 'Duplicate table alias',
    },
    '42723': {
      name: 'duplicate_function',
      description: 'Function with same arguments already exists',
    },
    '42P03': {
      name: 'duplicate_cursor',
      description: 'Cursor name already exists',
    },
    '42P04': {
      name: 'duplicate_database',
      description: 'Database already exists',
    },
    '42P05': {
      name: 'duplicate_prepared_statement',
      description: 'Prepared statement name already exists',
    },
    '42P06': {
      name: 'duplicate_schema',
      description: 'Schema already exists',
    },
    '42P07': {
      name: 'duplicate_table',
      description: 'Table already exists',
    },
  },

  // SQL quality problems - QA Agent should fix these
  sql_quality: {
    // Class 42 - Syntax Error or Access Rule Violation (query-related)
    '42601': {
      name: 'syntax_error',
      description: 'SQL syntax error - invalid SQL statement',
    },
    '42883': {
      name: 'undefined_function',
      description: 'Function does not exist or wrong argument types',
    },
    '42P08': {
      name: 'ambiguous_parameter',
      description: 'Parameter reference is ambiguous',
    },
    '42P09': {
      name: 'ambiguous_alias',
      description: 'Table alias is ambiguous',
    },
    '42P10': {
      name: 'invalid_column_reference',
      description: 'Invalid reference to a column',
    },
    '42611': {
      name: 'invalid_column_definition',
      description: 'Invalid column definition',
    },
    '42P11': {
      name: 'invalid_cursor_definition',
      description: 'Invalid cursor definition',
    },
    '42P12': {
      name: 'invalid_database_definition',
      description: 'Invalid database definition',
    },
    '42P13': {
      name: 'invalid_function_definition',
      description: 'Invalid function definition',
    },
    '42P14': {
      name: 'invalid_prepared_statement_definition',
      description: 'Invalid prepared statement definition',
    },
    '42P15': {
      name: 'invalid_schema_definition',
      description: 'Invalid schema definition',
    },
    '42P16': {
      name: 'invalid_table_definition',
      description: 'Invalid table definition',
    },
    '42P17': {
      name: 'invalid_object_definition',
      description: 'Invalid database object definition',
    },
    // Class 22 - Data Exception
    '22P02': {
      name: 'invalid_text_representation',
      description: 'Invalid input syntax for data type',
    },
    '22003': {
      name: 'numeric_value_out_of_range',
      description: 'Numeric value out of range',
    },
    '22012': {
      name: 'division_by_zero',
      description: 'Division by zero',
    },
    '22023': {
      name: 'invalid_parameter_value',
      description: 'Invalid parameter value',
    },
  },
} as const

/**
 * Classify a PostgreSQL error code into a category
 *
 * @param errorCode - 5-character PostgreSQL error code (e.g., "23503")
 * @returns Error classification with category and details
 *
 * @example
 * ```typescript
 * const result = classifyPostgresError("23503");
 * console.log(result.category); // "schema"
 * console.log(result.errorName); // "foreign_key_violation"
 * console.log(result.shouldRetryWithSchemaFix); // true
 * ```
 */
export const classifyPostgresError = (
  errorCode: string,
): ErrorClassification => {
  // Check schema problems
  if (errorCode in POSTGRES_ERROR_CODES.schema) {
    const errorInfo =
      POSTGRES_ERROR_CODES.schema[
        errorCode as keyof typeof POSTGRES_ERROR_CODES.schema
      ]
    return {
      category: 'schema',
      errorCode,
      errorName: errorInfo.name,
      description: errorInfo.description,
      shouldRetryWithSchemaFix: true,
    }
  }

  // Check SQL quality problems
  if (errorCode in POSTGRES_ERROR_CODES.sql_quality) {
    const errorInfo =
      POSTGRES_ERROR_CODES.sql_quality[
        errorCode as keyof typeof POSTGRES_ERROR_CODES.sql_quality
      ]
    return {
      category: 'sql_quality',
      errorCode,
      errorName: errorInfo.name,
      description: errorInfo.description,
      shouldRetryWithSchemaFix: false,
    }
  }

  // Unknown error code
  return {
    category: 'unknown',
    errorCode,
    description: 'Unknown PostgreSQL error code',
    shouldRetryWithSchemaFix: false,
  }
}

/**
 * Extract PostgreSQL error code from error message
 *
 * Attempts to extract a 5-character error code from various error message formats
 *
 * @param errorMessage - Error message string
 * @returns Error code if found, undefined otherwise
 *
 * @example
 * ```typescript
 * extractErrorCode('ERROR: foreign_key_violation (23503)'); // "23503"
 * extractErrorCode('error code 23503: violation'); // "23503"
 * extractErrorCode('generic error'); // undefined
 * ```
 */
export const extractErrorCode = (
  errorMessage: string,
): string | undefined => {
  // Try to match 5-character error code in various formats
  // Format 1: (23503)
  const match1 = errorMessage.match(/\(([0-9A-Z]{5})\)/)
  if (match1?.[1]) return match1[1]

  // Format 2: error code 23503
  const match2 = errorMessage.match(/error code ([0-9A-Z]{5})/i)
  if (match2?.[1]) return match2[1]

  // Format 3: code: 23503
  const match3 = errorMessage.match(/code:\s*([0-9A-Z]{5})/i)
  if (match3?.[1]) return match3[1]

  // Format 4: SQLSTATE[23503]
  const match4 = errorMessage.match(/SQLSTATE\[([0-9A-Z]{5})\]/i)
  if (match4?.[1]) return match4[1]

  return undefined
}

/**
 * Classify a test failure based on error message
 *
 * This is a higher-level function that extracts error codes from messages
 * and classifies them appropriately
 *
 * @param errorMessage - Error message from test execution
 * @returns Error classification
 *
 * @example
 * ```typescript
 * const result = classifyTestFailure(
 *   'ERROR: foreign_key_violation (23503): Referenced row not found'
 * );
 * console.log(result.category); // "schema"
 * console.log(result.shouldRetryWithSchemaFix); // true
 * ```
 */
export const classifyTestFailure = (
  errorMessage: string,
): ErrorClassification => {
  const errorCode = extractErrorCode(errorMessage)

  if (errorCode) {
    return classifyPostgresError(errorCode)
  }

  // No error code found - try to classify based on message content
  const lowerMessage = errorMessage.toLowerCase()

  // Check for common schema-related keywords
  if (
    lowerMessage.includes('does not exist') ||
    lowerMessage.includes('relation') ||
    lowerMessage.includes('column') ||
    lowerMessage.includes('table') ||
    lowerMessage.includes('constraint') ||
    lowerMessage.includes('foreign key') ||
    lowerMessage.includes('not null') ||
    lowerMessage.includes('unique')
  ) {
    return {
      category: 'schema',
      description: 'Schema-related error detected from message content',
      shouldRetryWithSchemaFix: true,
    }
  }

  // Check for common SQL quality keywords
  if (
    lowerMessage.includes('syntax error') ||
    lowerMessage.includes('invalid syntax') ||
    lowerMessage.includes('parse error')
  ) {
    return {
      category: 'sql_quality',
      description: 'SQL quality error detected from message content',
      shouldRetryWithSchemaFix: false,
    }
  }

  // Default to unknown
  return {
    category: 'unknown',
    description: 'Could not classify error from message',
    shouldRetryWithSchemaFix: false,
  }
}
