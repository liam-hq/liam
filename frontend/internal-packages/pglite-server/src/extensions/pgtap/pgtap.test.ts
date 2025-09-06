import { PGlite } from '@electric-sql/pglite'
import { describe, expect, test } from 'vitest'
import { pgtap } from './index'

describe('pgTAP extension', () => {
  test('loads and creates extension successfully', async () => {
    const db = new PGlite({ extensions: { pgtap } })

    await db.query('CREATE EXTENSION pgtap')

    // Verify extension is installed
    const result = await db.query(
      "SELECT extname FROM pg_extension WHERE extname = 'pgtap'",
    )
    expect(result.rows).toEqual([{ extname: 'pgtap' }])
  })

  test('database testing functions work', async () => {
    const db = new PGlite({ extensions: { pgtap } })
    await db.query('CREATE EXTENSION pgtap')

    // Complete TAP workflow following pgTAP.org pattern
    await db.query('BEGIN')
    await db.query('SELECT plan(2)')

    // Create test table
    await db.query('CREATE TABLE test_table (id integer, name text)')

    // Test table existence - pgTAP functions return TAP formatted strings
    const hasTableResult = await db.query("SELECT has_table('test_table')")
    expect(hasTableResult.rows).toEqual([
      { has_table: 'ok 1 - Table test_table should exist' },
    ])

    // Test column existence
    const hasColumnResult = await db.query(
      "SELECT has_column('test_table', 'name')",
    )
    expect(hasColumnResult.rows).toEqual([
      { has_column: 'ok 2 - Column test_table.name should exist' },
    ])

    // Complete the test with finish()
    const finishResult = await db.query('SELECT * FROM finish()')
    // finish() returns empty rows but validates test count internally
    expect(finishResult.rows).toEqual([])

    await db.query('ROLLBACK')
  })
})
