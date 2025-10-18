import { parse } from 'valibot'
import { expect, it } from 'vitest'
import { hashSchema } from './schemas'

it('should pass valid texts', () => {
  expect(parse(hashSchema, 'users__columns__id')).toBe('users__columns__id')
  expect(parse(hashSchema, 'user_posts__columns__post_id')).toBe(
    'user_posts__columns__post_id',
  )
  expect(parse(hashSchema, 'posts__indexes__index_post_on_user_id')).toBe(
    'posts__indexes__index_post_on_user_id',
  )
})

it('should throw error with invalid texts', () => {
  expect(() => parse(hashSchema, '')).toThrowError()
  expect(() => parse(hashSchema, 'users')).toThrowError()
  expect(() => parse(hashSchema, 'a__b__c')).toThrowError()
})
