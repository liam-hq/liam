import type { Schema } from '@liam-hq/db-structure'
import { describe, expect, it } from 'vitest'
import { TEST_TIMEOUTS } from '../../testConfig'
import {
  userPostCategoryWithForeignKeysSchema,
  userPostWithForeignKeySchema,
  userPostWithPartialForeignKeySchema,
} from '../__fixtures__/schemas'
import { createSchema } from '../__fixtures__/testHelpers'
import { evaluate } from '../evaluate'

describe.skip('Schema Evaluation - Foreign Key Relationships', () => {
  it.todo('detects exact foreign key matches - needs evaluate function fix')

  it.skip(
    'handles renamed foreign key constraints correctly',
    async () => {
      // Create schema with different FK constraint name but same relationship
      const schemaWithRenamedFK = createSchema({
        tables: {
          users: {
            columns: {
              id: { type: 'INTEGER', notNull: true },
            },
            primaryKey: ['id'],
          },
          posts: {
            columns: {
              id: { type: 'INTEGER', notNull: true },
              user_id: { type: 'INTEGER', notNull: true },
            },
            primaryKey: ['id'],
            foreignKeys: [
              {
                columns: ['user_id'],
                targetTable: 'users',
                targetColumns: ['id'],
              },
            ],
          },
        },
      })

      // Manually rename the constraint
      const modifiedSchema: Schema = JSON.parse(
        JSON.stringify(schemaWithRenamedFK),
      )
      const oldConstraintName = 'fk_posts_user_id'
      const newConstraintName = 'users_id_to_posts_user_id'
      const postsTable = modifiedSchema.tables['posts']
      if (postsTable?.constraints[oldConstraintName]) {
        postsTable.constraints[newConstraintName] =
          postsTable.constraints[oldConstraintName]
        const constraint = postsTable.constraints[newConstraintName]
        if ('name' in constraint) {
          constraint.name = newConstraintName
        }
        delete postsTable.constraints[oldConstraintName]
      }

      const result = await evaluate(
        userPostWithForeignKeySchema,
        modifiedSchema,
      )

      expect(result.foreignKeyF1Score).toBe(1)
      expect(result.foreignKeyAllCorrectRate).toBe(1)
    },
    TEST_TIMEOUTS.MODEL_INITIALIZATION,
  )

  it.skip(
    'calculates partial F1 score for missing foreign keys',
    async () => {
      const result = await evaluate(
        userPostCategoryWithForeignKeysSchema,
        userPostWithPartialForeignKeySchema,
      )

      // Should have 1 match out of 2 reference FKs and 1 predicted FK
      // Precision: 1/1 = 1, Recall: 1/2 = 0.5
      // F1 = 2 * (1 * 0.5) / (1 + 0.5) = 0.666...
      expect(result.foreignKeyF1Score).toBeCloseTo(0.6666666666666666)
      expect(result.foreignKeyAllCorrectRate).toBe(0)
    },
    TEST_TIMEOUTS.MODEL_INITIALIZATION,
  )

  it(
    'returns zero scores when no foreign keys match',
    async () => {
      const referenceWithFK = userPostWithForeignKeySchema

      // Schema with different FK relationship (author_id instead of user_id)
      const predictWithDifferentFK = createSchema({
        tables: {
          users: {
            columns: {
              id: { type: 'INTEGER', notNull: true },
            },
            primaryKey: ['id'],
          },
          posts: {
            columns: {
              id: { type: 'INTEGER', notNull: true },
              author_id: { type: 'INTEGER', notNull: true },
            },
            primaryKey: ['id'],
            foreignKeys: [
              {
                columns: ['author_id'],
                targetTable: 'users',
                targetColumns: ['id'],
              },
            ],
          },
        },
      })

      const result = await evaluate(referenceWithFK, predictWithDifferentFK)

      expect(result.foreignKeyF1Score).toBe(0)
      expect(result.foreignKeyAllCorrectRate).toBe(0)
    },
    TEST_TIMEOUTS.MODEL_INITIALIZATION,
  )
})
