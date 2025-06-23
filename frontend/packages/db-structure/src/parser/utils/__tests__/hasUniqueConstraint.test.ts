import { describe, expect, test } from 'vitest'
import type { Constraints } from '../../../schema/schema.js'
import { hasUniqueConstraint } from '../hasUniqueConstraint.js'

describe('hasUniqueConstraint', () => {
  test('returns true when column has unique constraint', () => {
    const constraints: Constraints = {
      unique_email: {
        type: 'UNIQUE',
        name: 'unique_email',
        columnName: 'email',
      },
      pk_users: {
        type: 'PRIMARY KEY',
        name: 'pk_users',
        columnName: 'id',
      },
    }

    expect(hasUniqueConstraint(constraints, 'email')).toBe(true)
  })

  test('returns false when column has no unique constraint', () => {
    const constraints: Constraints = {
      pk_users: {
        type: 'PRIMARY KEY',
        name: 'pk_users',
        columnName: 'id',
      },
      fk_user_role: {
        type: 'FOREIGN KEY',
        name: 'fk_user_role',
        columnName: 'role_id',
        targetTableName: 'roles',
        targetColumnName: 'id',
        updateConstraint: 'CASCADE',
        deleteConstraint: 'CASCADE',
      },
    }

    expect(hasUniqueConstraint(constraints, 'name')).toBe(false)
  })

  test('returns false when column has other constraint types but not unique', () => {
    const constraints: Constraints = {
      pk_users: {
        type: 'PRIMARY KEY',
        name: 'pk_users',
        columnName: 'id',
      },
      check_age: {
        type: 'CHECK',
        name: 'check_age',
        detail: 'age > 0',
      },
    }

    expect(hasUniqueConstraint(constraints, 'id')).toBe(false)
  })

  test('returns false when constraints object is empty', () => {
    const constraints: Constraints = {}

    expect(hasUniqueConstraint(constraints, 'email')).toBe(false)
  })

  test('returns true when column has multiple unique constraints', () => {
    const constraints: Constraints = {
      unique_email: {
        type: 'UNIQUE',
        name: 'unique_email',
        columnName: 'email',
      },
      unique_username: {
        type: 'UNIQUE',
        name: 'unique_username',
        columnName: 'username',
      },
    }

    expect(hasUniqueConstraint(constraints, 'email')).toBe(true)
    expect(hasUniqueConstraint(constraints, 'username')).toBe(true)
    expect(hasUniqueConstraint(constraints, 'name')).toBe(false)
  })
})
