import { parse } from 'valibot'
import { describe, expect, it } from 'vitest'
import { hashSchema } from './schemas'

describe('should pass valid texts', () => {
  it('category level hash', () => {
    expect(parse(hashSchema, 'users__columns')).toBe('users__columns')
    expect(parse(hashSchema, 'posts__indexes')).toBe('posts__indexes')
    expect(parse(hashSchema, 'user_posts__constraints')).toBe(
      'user_posts__constraints',
    )
  })

  it('item level hash', () => {
    expect(parse(hashSchema, 'users__columns__id')).toBe('users__columns__id')
    expect(parse(hashSchema, 'posts__indexes__index_post_on_user_id')).toBe(
      'posts__indexes__index_post_on_user_id',
    )
    expect(parse(hashSchema, 'user_posts__constraints__primary_id')).toBe(
      'user_posts__constraints__primary_id',
    )
  })
})

it('should throw error with invalid texts', () => {
  expect(() => parse(hashSchema, '')).toThrowError()
  expect(() => parse(hashSchema, 'users')).toThrowError()
  expect(() => parse(hashSchema, 'a__b__c')).toThrowError()
})
