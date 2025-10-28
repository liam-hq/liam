import { describe, expect, it } from 'vitest'
import { isPgTapTest, validatePgTapTest } from './validatePgTapTest'

describe('isPgTapTest', () => {
  it('returns true when SQL contains lives_ok(', () => {
    const sql = "SELECT lives_ok('SELECT 1');"
    expect(isPgTapTest(sql)).toBe(true)
  })

  it('returns true when SQL contains throws_ok(', () => {
    const sql = "SELECT throws_ok('SELECT 1/0');"
    expect(isPgTapTest(sql)).toBe(true)
  })

  it('returns true when SQL contains has_table(', () => {
    const sql = "SELECT has_table('users');"
    expect(isPgTapTest(sql)).toBe(true)
  })

  it('returns true when SQL contains has_column(', () => {
    const sql = "SELECT has_column('users', 'id');"
    expect(isPgTapTest(sql)).toBe(true)
  })

  it('returns true when SQL contains is(', () => {
    const sql = 'SELECT is(1, 1);'
    expect(isPgTapTest(sql)).toBe(true)
  })

  it('returns true when SQL contains ok(', () => {
    const sql = 'SELECT ok(true);'
    expect(isPgTapTest(sql)).toBe(true)
  })

  it('returns false when SQL does not contain pgTAP functions', () => {
    const sql = 'SELECT * FROM users;'
    expect(isPgTapTest(sql)).toBe(false)
  })

  it('is case-insensitive', () => {
    const sql = 'SELECT LIVES_OK($$SELECT 1$$);'
    expect(isPgTapTest(sql)).toBe(true)
  })
})

describe('validatePgTapTest', () => {
  it('returns error when no assertions are found', () => {
    const sql = `
      SELECT 1;
    `
    const result = validatePgTapTest(sql)
    expect(result).toContain('No pgTAP assertions found')
  })

  it('returns error with multiple validation errors', () => {
    const sql = `
      SELECT 1;
    `
    const result = validatePgTapTest(sql)
    expect(result).toContain('pgTAP test validation failed')
  })

  it('returns undefined for valid pgTAP test using lives_ok', () => {
    const sql = `
      SELECT lives_ok($$SELECT 1$$, 'Basic query works');
    `
    const result = validatePgTapTest(sql)
    expect(result).toBeUndefined()
  })

  it('returns undefined for valid pgTAP test using throws_ok', () => {
    const sql = `
      SELECT throws_ok($$SELECT 1/0$$, '22012');
    `
    const result = validatePgTapTest(sql)
    expect(result).toBeUndefined()
  })

  it('returns undefined for valid pgTAP test using has_table', () => {
    const sql = `
      SELECT has_table('users');
    `
    const result = validatePgTapTest(sql)
    expect(result).toBeUndefined()
  })

  it('returns undefined for valid pgTAP test using is()', () => {
    const sql = `
      SELECT is(1, 1, 'One equals one');
    `
    const result = validatePgTapTest(sql)
    expect(result).toBeUndefined()
  })

  it('returns undefined for valid pgTAP test using ok()', () => {
    const sql = `
      SELECT ok(true, 'True is true');
    `
    const result = validatePgTapTest(sql)
    expect(result).toBeUndefined()
  })

  it('is case-insensitive for validation', () => {
    const sql = `
      SELECT HAS_TABLE('users');
    `
    const result = validatePgTapTest(sql)
    expect(result).toBeUndefined()
  })

  it('returns undefined for multiple assertions without plan/finish', () => {
    const sql = `
      SELECT lives_ok($$INSERT INTO users (name) VALUES ('test')$$, 'Insert user');
      SELECT is((SELECT COUNT(*) FROM users), 1::bigint, 'User count is 1');
    `
    const result = validatePgTapTest(sql)
    expect(result).toBeUndefined()
  })

  it('returns error when pgTAP function has syntax error with semicolon before closing parenthesis', () => {
    const sql = 'SELECT lives_ok($$SELECT 1$$;)'
    const result = validatePgTapTest(sql)
    expect(result).toContain('Semicolon before closing parenthesis detected')
  })
})
