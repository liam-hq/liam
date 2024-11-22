import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from '.'

describe(parse, () => {
  it('should parse schema.rb to JSON correctly', async () => {
    const schemaText = fs.readFileSync(
      path.resolve(__dirname, './schemarb/input/schema1.in.rb'),
      'utf-8',
    )

    const result = await parse(schemaText, 'schemarb')
    expect(result).toMatchSnapshot()
  })

  it('should parse postgresql to JSON correctly', async () => {
    const schemaText = fs.readFileSync(
      path.resolve(__dirname, './sql/input/postgresql_schema1.in.sql'),
      'utf-8',
    )

    const result = await parse(schemaText, 'postgres')
    expect(result).toMatchSnapshot()
  })
})
