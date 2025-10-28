import { describe, expect, it } from 'vitest'
import { getTableIndexLinkHref } from './getTableIndexLinkHref'

it('should return the "active" query parameter and hash consistent with the table and index names', () => {
  window.location.search = ''
  window.location.hash = ''

  expect(getTableIndexLinkHref('users', 'users_on_status_id')).toBe(
    '?active=users#users__indexes__users_on_status_id',
  )
})

describe('when other query parameters and hash are present', () => {
  it('should preserve existing query parameters and hash', () => {
    window.location.search = '?page=2&sort=asc'
    window.location.hash = '#other_hash'

    expect(getTableIndexLinkHref('users', 'users_on_status_id')).toBe(
      '?page=2&sort=asc&active=users#users__indexes__users_on_status_id',
    )
  })
})
