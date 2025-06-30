import { describe, expect, it } from 'vitest'
import { evaluate } from '../evaluate'
import {
  simpleUserPostSchema,
  similarNamesReferenceSchema,
  similarNamesPredictSchema,
  customerReferenceSchema,
  customerPredictSchema,
} from './fixtures/schemas'

const TIMEOUT = 30000

describe('evaluate - 基本的なスキーママッチング', () => {
  it(
    '完全一致: user/postスキーマが100%一致する場合',
    async () => {
      const result = await evaluate(simpleUserPostSchema, simpleUserPostSchema)

      expect(result.tableF1Score).toBe(1)
      expect(result.tableAllCorrectRate).toBe(1)
      expect(result.columnF1ScoreAverage).toBeCloseTo(1)
      expect(result.primaryKeyAccuracyAverage).toBeCloseTo(1)
      expect(result.foreignKeyF1Score).toBe(0) // 外部キーは定義されていない
      expect(result.foreignKeyAllCorrectRate).toBe(0)
      expect(result.overallSchemaAccuracy).toBe(1)
    },
    TIMEOUT,
  )

  it(
    '類似テーブル名: user_account→user, blog_post→postの意味的マッチング',
    async () => {
      const result = await evaluate(similarNamesReferenceSchema, similarNamesPredictSchema)

      // AIモデルが意味的類似性を認識してテーブルをマッチング
      expect(result.tableF1Score).toBeCloseTo(1, 1)
      expect(result.tableAllCorrectRate).toBe(1)

      // カラムは部分的にマッチ（email→email_address, title→post_title）
      expect(result.columnF1ScoreAverage).toBeCloseTo(0.75, 3)
      expect(result.columnAllCorrectRateAverage).toBeCloseTo(0.5, 3)

      // プライマリキーのカラム名が異なる
      expect(result.primaryKeyAccuracyAverage).toBeCloseTo(0.5, 3)
      expect(result.overallSchemaAccuracy).toBe(0)
    },
    TIMEOUT,
  )

  it(
    '部分的なカラムマッチング: customerテーブルでfirst_nameは一致、last_name→surname、email→email_addressは類似',
    async () => {
      const result = await evaluate(customerReferenceSchema, customerPredictSchema)

      // テーブル名は完全一致
      expect(result.tableF1Score).toBe(1)
      expect(result.tableAllCorrectRate).toBe(1)

      // カラムは3/4がマッチ（first_nameは完全一致、他は意味的類似）
      expect(result.columnF1ScoreAverage).toBeCloseTo(0.75, 3)
      expect(result.columnAllCorrectRateAverage).toBe(0) // 完全一致ではない

      // プライマリキーは存在するが名前が異なる
      expect(result.primaryKeyAccuracyAverage).toBe(1)
      expect(result.overallSchemaAccuracy).toBe(0)
    },
    TIMEOUT,
  )
})