import { expect } from 'vitest'
import { parse } from '../../parser/index.js'

export const expectGeneratedSQLToBeParseable = async (sql: string) => {
  const parseResult = await parse(sql, 'postgres')
  expect(parseResult.errors).toHaveLength(0)
}
