import { describe, expect, it } from 'vitest'
import {
  classifyPostgresError,
  classifyTestFailure,
  extractErrorCode,
} from './classifyError'

describe('classifyError', () => {
  describe('classifyPostgresError', () => {
    it('should classify foreign_key_violation as schema problem', () => {
      const result = classifyPostgresError('23503')

      expect(result.category).toBe('schema')
      expect(result.errorCode).toBe('23503')
      expect(result.errorName).toBe('foreign_key_violation')
      expect(result.shouldRetryWithSchemaFix).toBe(true)
    })

    it('should classify not_null_violation as schema problem', () => {
      const result = classifyPostgresError('23502')

      expect(result.category).toBe('schema')
      expect(result.errorCode).toBe('23502')
      expect(result.errorName).toBe('not_null_violation')
      expect(result.shouldRetryWithSchemaFix).toBe(true)
    })

    it('should classify unique_violation as schema problem', () => {
      const result = classifyPostgresError('23505')

      expect(result.category).toBe('schema')
      expect(result.errorName).toBe('unique_violation')
      expect(result.shouldRetryWithSchemaFix).toBe(true)
    })

    it('should classify check_violation as schema problem', () => {
      const result = classifyPostgresError('23514')

      expect(result.category).toBe('schema')
      expect(result.errorName).toBe('check_violation')
      expect(result.shouldRetryWithSchemaFix).toBe(true)
    })

    it('should classify undefined_table as schema problem', () => {
      const result = classifyPostgresError('42P01')

      expect(result.category).toBe('schema')
      expect(result.errorCode).toBe('42P01')
      expect(result.errorName).toBe('undefined_table')
      expect(result.shouldRetryWithSchemaFix).toBe(true)
    })

    it('should classify undefined_column as schema problem', () => {
      const result = classifyPostgresError('42703')

      expect(result.category).toBe('schema')
      expect(result.errorCode).toBe('42703')
      expect(result.errorName).toBe('undefined_column')
      expect(result.shouldRetryWithSchemaFix).toBe(true)
    })

    it('should classify syntax_error as SQL quality problem', () => {
      const result = classifyPostgresError('42601')

      expect(result.category).toBe('sql_quality')
      expect(result.errorCode).toBe('42601')
      expect(result.errorName).toBe('syntax_error')
      expect(result.shouldRetryWithSchemaFix).toBe(false)
    })

    it('should classify invalid_text_representation as SQL quality problem', () => {
      const result = classifyPostgresError('22P02')

      expect(result.category).toBe('sql_quality')
      expect(result.errorCode).toBe('22P02')
      expect(result.errorName).toBe('invalid_text_representation')
      expect(result.shouldRetryWithSchemaFix).toBe(false)
    })

    it('should classify undefined_function as SQL quality problem', () => {
      const result = classifyPostgresError('42883')

      expect(result.category).toBe('sql_quality')
      expect(result.errorName).toBe('undefined_function')
      expect(result.shouldRetryWithSchemaFix).toBe(false)
    })

    it('should classify unknown error code', () => {
      const result = classifyPostgresError('99999')

      expect(result.category).toBe('unknown')
      expect(result.errorCode).toBe('99999')
      expect(result.shouldRetryWithSchemaFix).toBe(false)
    })
  })

  describe('extractErrorCode', () => {
    it('should extract error code from parentheses format', () => {
      const code = extractErrorCode(
        'ERROR: foreign_key_violation (23503): Referenced row not found',
      )

      expect(code).toBe('23503')
    })

    it('should extract error code from "error code" format', () => {
      const code = extractErrorCode('error code 23502: NOT NULL violation')

      expect(code).toBe('23502')
    })

    it('should extract error code from "code:" format', () => {
      const code = extractErrorCode('Query failed with code: 42601')

      expect(code).toBe('42601')
    })

    it('should extract error code from SQLSTATE format', () => {
      const code = extractErrorCode('SQLSTATE[23503] constraint violation')

      expect(code).toBe('23503')
    })

    it('should return undefined for message without error code', () => {
      const code = extractErrorCode('Generic database error occurred')

      expect(code).toBeUndefined()
    })
  })

  describe('classifyTestFailure', () => {
    it('should classify test failure with error code', () => {
      const result = classifyTestFailure(
        'ERROR: foreign_key_violation (23503): Referenced row not found',
      )

      expect(result.category).toBe('schema')
      expect(result.errorCode).toBe('23503')
      expect(result.shouldRetryWithSchemaFix).toBe(true)
    })

    it('should classify based on "does not exist" keyword', () => {
      const result = classifyTestFailure(
        'ERROR: relation "users" does not exist',
      )

      expect(result.category).toBe('schema')
      expect(result.shouldRetryWithSchemaFix).toBe(true)
    })

    it('should classify based on "constraint" keyword', () => {
      const result = classifyTestFailure(
        'ERROR: constraint "fk_product" violated',
      )

      expect(result.category).toBe('schema')
      expect(result.shouldRetryWithSchemaFix).toBe(true)
    })

    it('should classify based on "syntax error" keyword', () => {
      const result = classifyTestFailure(
        'ERROR: syntax error at or near "SELCT"',
      )

      expect(result.category).toBe('sql_quality')
      expect(result.shouldRetryWithSchemaFix).toBe(false)
    })

    it('should classify unknown error', () => {
      const result = classifyTestFailure('Something went wrong')

      expect(result.category).toBe('unknown')
      expect(result.shouldRetryWithSchemaFix).toBe(false)
    })
  })
})
