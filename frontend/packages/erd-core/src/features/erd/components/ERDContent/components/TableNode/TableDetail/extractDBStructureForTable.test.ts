import type { DBStructure } from '@liam-hq/db-structure'
import { aColumn, aRelationship, aTable } from '@liam-hq/db-structure'
import { describe, expect, it } from 'vitest'
import { extractDBStructureForTable } from './extractDBStructureForTable'

describe(extractDBStructureForTable, () => {
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
  const userPosts = aRelationship({
    name: 'userPosts',
    primaryTableName: 'users',
    primaryColumnName: 'id',
    foreignTableName: 'posts',
    foreignColumnName: 'userId',
  })

  const postComments = aRelationship({
    name: 'postComments',
    primaryTableName: 'posts',
    primaryColumnName: 'id',
    foreignTableName: 'comments',
    foreignColumnName: 'postId',
  })

  const dbStructure: DBStructure = {
    tables: {
      users,
      posts,
      comments,
    },
    relationships: {
      userPosts,
      postComments,
    },
  }

  it('should extract related tables and relationships for the given table (primary table)', () => {
    const result = extractDBStructureForTable(users, dbStructure)
    expect(result).toEqual({
      tables: { users, posts },
      relationships: { userPosts },
    })
  })

  it('should extract related tables and relationships for the given table (foreign table)', () => {
    const result = extractDBStructureForTable(comments, dbStructure)
    expect(result).toEqual({
      tables: { posts, comments },
      relationships: { postComments },
    })
  })

  it('should return empty tables and relationships if no relationships are found', () => {
    const emptyDBStructure: DBStructure = {
      tables: { users },
      relationships: {},
    }
    const result = extractDBStructureForTable(users, emptyDBStructure)
    expect(result).toEqual({
      tables: {},
      relationships: {},
    })
  })
})
