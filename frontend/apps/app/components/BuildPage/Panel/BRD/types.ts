import type { Schema } from '@liam-hq/db-structure'
import type { ReviewComment } from '../MigrationsViewer/types'

export type ErrorObject = {
  name: string
  message: string
  instruction?: string
}

export type SqlBlock = {
  title: string
  code: string
  executable?: boolean
}

export type ExecutionResult = {
  status: 'success' | 'error' | 'loading'
  data?: Array<Record<string, string | number | null>>
  explainData?: Array<Record<string, string | number | null>>
  message?: string
  rowsAffected?: number
}

export type UseCase = {
  id: string
  title: string
  steps?: string[]
  sqlBlocks?: SqlBlock[]
  additionalSteps?: string[]
  bullets?: string[]
}

export type RelatedTable = {
  name: string
  schema?: Schema['tables'][0] // 関連するテーブルのスキーマ情報
}

export type BusinessRequirement = {
  id: string
  title: string
  overview: string[]
  useCases: UseCase[]
  relatedSchema: Schema
}

// SQL実行機能の抽象化
export type SqlExecutor = (code: string) => Promise<ExecutionResult>

// バージョン情報の型
export type VersionInfo = {
  version: string
  gitHash?: string
  envName?: string
  date?: string
  displayedOn: string
}

// スキーマデータの型
export type SchemaData = {
  current: Schema
  previous: Schema
}

// BRDコンポーネントの新しいProps型
export type BRDProps = {
  schema: Schema
  errors: ErrorObject[]
  businessRequirements: BusinessRequirement[]
  sqlExecutor: SqlExecutor
  versionInfo: VersionInfo
  schemaData: SchemaData
  ddl: string
  reviewComments: ReviewComment[]
}
