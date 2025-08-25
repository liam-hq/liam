import * as v from 'valibot'
import { describe, expect, it } from 'vitest'
import { operationSchema } from '../index.js'

describe('constraint operations', () => {
  describe('replaceConstraintColumnNamesArrayOperation', () => {
    it('should accept valid constraint column names array replace operation', () => {
      const operation = {
        op: 'replace',
        path: '/tables/aquariums/constraints/pk_aquariums/columnNames/0',
        value: 'id',
      }
      const result = v.safeParse(operationSchema, operation)
      expect(result.success).toBe(true)
    })

    it('should accept multiple array indices', () => {
      const operations = [
        {
          op: 'replace',
          path: '/tables/users/constraints/unique_email_name/columnNames/0',
          value: 'email',
        },
        {
          op: 'replace',
          path: '/tables/users/constraints/unique_email_name/columnNames/1',
          value: 'name',
        },
        {
          op: 'replace',
          path: '/tables/users/constraints/unique_email_name/columnNames/10',
          value: 'created_at',
        },
      ]

      operations.forEach((operation) => {
        const result = v.safeParse(operationSchema, operation)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid array indices', () => {
      const invalidOperations = [
        {
          op: 'replace',
          path: '/tables/users/constraints/pk_users/columnNames/abc',
          value: 'id',
        },
        {
          op: 'replace',
          path: '/tables/users/constraints/pk_users/columnNames/-1',
          value: 'id',
        },
        {
          op: 'replace',
          path: '/tables/users/constraints/pk_users/columnNames/',
          value: 'id',
        },
      ]

      invalidOperations.forEach((operation) => {
        const result = v.safeParse(operationSchema, operation)
        expect(result.success).toBe(false)
      })
    })
  })
})
