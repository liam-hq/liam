import { describe, expect, it } from 'vitest'
import { isPgTapTest, validatePgTapTest } from './validatePgTapTest'

describe('isPgTapTest', () => {
  it('returns true when SQL contains plan(', () => {
    const sql = 'SELECT plan(1);'
    expect(isPgTapTest(sql)).toBe(true)
  })

  it('returns true when SQL contains finish()', () => {
    const sql = 'SELECT finish();'
    expect(isPgTapTest(sql)).toBe(true)
  })

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

  it('returns false when SQL does not contain pgTAP functions', () => {
    const sql = 'SELECT * FROM users;'
    expect(isPgTapTest(sql)).toBe(false)
  })

  it('is case-insensitive', () => {
    const sql = 'SELECT PLAN(1);'
    expect(isPgTapTest(sql)).toBe(true)
  })
})

describe('validatePgTapTest', () => {
  it('returns error when plan() is missing', () => {
    const sql = `
      SELECT has_table('users');
      SELECT finish();
    `
    const result = validatePgTapTest(sql)
    expect(result).toContain('Missing plan() declaration')
  })

  it('returns error when plan() is called multiple times', () => {
    const sql = `
      SELECT plan(1);
      SELECT has_table('users');
      SELECT plan(2);
      SELECT finish();
    `
    const result = validatePgTapTest(sql)
    expect(result).toContain('Multiple plan() declarations found')
  })

  it('returns error when finish() is missing', () => {
    const sql = `
      SELECT plan(1);
      SELECT has_table('users');
    `
    const result = validatePgTapTest(sql)
    expect(result).toContain('Missing finish() call')
  })

  it('returns error when no assertions are found', () => {
    const sql = `
      SELECT plan(1);
      SELECT finish();
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
      SELECT plan(1);
      SELECT lives_ok('SELECT 1', 'Basic query works');
      SELECT finish();
    `
    const result = validatePgTapTest(sql)
    expect(result).toBeUndefined()
  })

  it('returns undefined for valid pgTAP test using throws_ok', () => {
    const sql = `
      SELECT plan(1);
      SELECT throws_ok('SELECT 1/0', 'division by zero');
      SELECT finish();
    `
    const result = validatePgTapTest(sql)
    expect(result).toBeUndefined()
  })

  it('returns undefined for valid pgTAP test using has_table', () => {
    const sql = `
      SELECT plan(1);
      SELECT has_table('users');
      SELECT finish();
    `
    const result = validatePgTapTest(sql)
    expect(result).toBeUndefined()
  })

  it('returns undefined for valid pgTAP test using is()', () => {
    const sql = `
      SELECT plan(1);
      SELECT is(1, 1, 'One equals one');
      SELECT finish();
    `
    const result = validatePgTapTest(sql)
    expect(result).toBeUndefined()
  })

  it('returns undefined for valid pgTAP test using ok()', () => {
    const sql = `
      SELECT plan(1);
      SELECT ok(true, 'True is true');
      SELECT finish();
    `
    const result = validatePgTapTest(sql)
    expect(result).toBeUndefined()
  })

  it('is case-insensitive for validation', () => {
    const sql = `
      SELECT PLAN(1);
      SELECT HAS_TABLE('users');
      SELECT FINISH();
    `
    const result = validatePgTapTest(sql)
    expect(result).toBeUndefined()
  })
})
