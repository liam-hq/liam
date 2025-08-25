import type { Schema } from '@liam-hq/schema'
import { aColumn, aTable } from '@liam-hq/schema'
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
    constraints: {
      userPosts: {
        type: 'FOREIGN KEY',
        name: 'userPosts',
        columnNames: ['userId'],
        targetTableName: 'users',
        targetColumnNames: ['id'],
        updateConstraint: 'NO_ACTION',
        deleteConstraint: 'NO_ACTION',
      },
    },
  })
  const comments = aTable({
    name: 'comments',
    columns: {
      postId: aColumn({ name: 'postId' }),
    },
    constraints: {
      postComments: {
        type: 'FOREIGN KEY',
        name: 'postComments',
        columnNames: ['postId'],
        targetTableName: 'posts',
        targetColumnNames: ['id'],
        updateConstraint: 'NO_ACTION',
        deleteConstraint: 'NO_ACTION',
      },
    },
  })
  // Relationships will be derived from constraints

  const schema: Schema = {
    tables: {
      users,
      posts,
      comments,
    },
    enums: {},
  }

  it('should extract related tables for the given table (primary table)', () => {
    const result = extractSchemaForTable(users, schema)
    expect(result).toEqual({
      tables: { users, posts },
      enums: {},
    })
  })

  it('should extract related tables for the given table (foreign table)', () => {
    const result = extractSchemaForTable(comments, schema)
    expect(result).toEqual({
      tables: { posts, comments },
      enums: {},
    })
  })

  it('should return its own table if no relationships are found', () => {
    const emptySchema: Schema = {
      tables: { users },
      enums: {},
    }
    const result = extractSchemaForTable(users, emptySchema)
    expect(result).toEqual({
      tables: { users },
      enums: {},
    })
  })
})
