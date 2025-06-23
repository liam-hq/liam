import type { Schema } from '@liam-hq/db-structure'
import { aColumn, aTable } from '@liam-hq/db-structure'
import { describe, expect, it } from 'vitest'
import { extractSchemaForTable } from './extractSchemaForTable'

describe(extractSchemaForTable, () => {
  const users = aTable({
    name: 'users',
  })
  const posts = aTable({
    name: 'posts',
    columns: {
      userId: aColumn({ name: 'userId' }),
    },
  })
  const comments = aTable({
    name: 'comments',
    columns: {
      postId: aColumn({ name: 'postId' }),
    },
  })

  const schema: Schema = {
    tables: {
      users,
      posts,
      comments,
    },
    tableGroups: {},
  }

  it('should extract related tables and relationships for the given table (primary table)', () => {
    const result = extractSchemaForTable(users, schema)
    expect(result).toEqual({
      tables: { users },
      tableGroups: {},
    })
  })

  it('should extract related tables and relationships for the given table (foreign table)', () => {
    const result = extractSchemaForTable(comments, schema)
    expect(result).toEqual({
      tables: { comments },
      tableGroups: {},
    })
  })

  it('should return its own table and empty relationships if no relationships are found', () => {
    const emptySchema: Schema = {
      tables: { users },
      tableGroups: {},
    }
    const result = extractSchemaForTable(users, emptySchema)
    expect(result).toEqual({
      tables: { users },
      tableGroups: {},
    })
  })
})
