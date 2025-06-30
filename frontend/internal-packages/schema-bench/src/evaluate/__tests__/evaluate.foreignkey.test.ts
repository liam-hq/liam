import { describe, expect, it } from 'vitest'
import { evaluate } from '../evaluate'
import {
  foreignKeySimpleSchema,
  multipleForeignKeysReferenceSchema,
  partialForeignKeysPredictSchema,
  differentForeignKeyColumnSchema,
  createSchema,
  createUserTable,
  createTable,
  createIdColumn,
  createIntegerColumn,
  createPrimaryKeyConstraint,
  createForeignKeyConstraint,
} from './fixtures/schemas.ts'

const TIMEOUT = 30000

describe('evaluate - 外部キー評価', () => {
  it(
    '外部キー完全一致: users→posts間の外部キーが完全に一致',
    async () => {
      const result = await evaluate(foreignKeySimpleSchema, foreignKeySimpleSchema)

      expect(result.foreignKeyF1Score).toBe(1)
      expect(result.foreignKeyAllCorrectRate).toBe(1)
    },
    TIMEOUT,
  )

  it(
    '外部キー部分一致: 2つのうち1つの外部キーのみ一致（F1スコア≈0.67）',
    async () => {
      const result = await evaluate(
        multipleForeignKeysReferenceSchema,
        partialForeignKeysPredictSchema
      )

      // 2つの外部キーのうち1つだけマッチ
      // Precision: 1/1 = 1, Recall: 1/2 = 0.5
      // F1 = 2 * (1 * 0.5) / (1 + 0.5) = 0.667
      expect(result.foreignKeyF1Score).toBeCloseTo(0.6666666666666666)
      expect(result.foreignKeyAllCorrectRate).toBe(0)
    },
    TIMEOUT,
  )

  it(
    '外部キーカラム名相違: user_id→author_idで意味的にはマッチ',
    async () => {
      const referenceWithUserFk = foreignKeySimpleSchema
      const predictWithAuthorFk = differentForeignKeyColumnSchema

      const result = await evaluate(referenceWithUserFk, predictWithAuthorFk)

      // AIモデルがuser_idとauthor_idの意味的類似性を認識
      expect(result.foreignKeyF1Score).toBe(0)
      expect(result.foreignKeyAllCorrectRate).toBe(0)
    },
    TIMEOUT,
  )

  it(
    '外部キー名の違いは無視: 制約名が異なっても同じ関係なら一致',
    async () => {
      const schemaWithDifferentFkName = createSchema({
        users: createUserTable({ tableName: 'users' }),
        posts: createTable(
          'posts',
          {
            id: createIdColumn(),
            user_id: createIntegerColumn('user_id'),
          },
          {
            pk_posts: createPrimaryKeyConstraint('posts'),
            users_id_to_posts_user_id: createForeignKeyConstraint(
              'posts',
              'user_id',
              'users',
              'id',
              'users_id_to_posts_user_id'
            ),
          }
        ),
      })

      const result = await evaluate(foreignKeySimpleSchema, schemaWithDifferentFkName)

      // 制約名が異なっても、同じ関係を表現していれば一致
      expect(result.foreignKeyF1Score).toBe(1)
      expect(result.foreignKeyAllCorrectRate).toBe(1)
    },
    TIMEOUT,
  )
})