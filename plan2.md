# LiamDB Executor Implementation Plan

## 現状

✅ **完了済み**
- `pnpm --filter @liam-hq/schema-bench executeLiamDB` コマンドの新設
- CLIファイル (`src/cli/executeLiamDb.ts`) の基本構造実装
- 入力ファイルの読み込み・出力ファイル生成の仕組み
- プレースホルダー実装での動作確認

## 次の実装計画

### 1. 依存関係の追加
**目標**: `@liam-hq/agent`パッケージを`@liam-hq/schema-bench`から利用できるようにする

**実装内容**:
- `@liam-hq/schema-bench/package.json`に`@liam-hq/agent`依存を追加
- 必要に応じて関連する依存関係も追加 (e.g., `@liam-hq/db-structure`)

### 2. LiamDB Executorクラスの実装
**目標**: `@liam-hq/agent`の`deepModeling`関数を呼び出すexecutorクラスを作成

**実装場所**: `src/executors/liamDb/`ディレクトリ

**ファイル構成**:
```
src/executors/liamDb/
├── index.ts           # エクスポート
├── liamDbExecutor.ts  # メインのexecutorクラス
├── types.ts           # 型定義
└── liamDbExecutor.test.ts # テスト
```

**実装内容**:
- `LiamDbExecutor`クラス
- `execute(input: LiamDbExecutorInput): Promise<Result<Schema, Error>>`メソッド
- `@liam-hq/agent`の`deepModeling`関数との統合
- InMemoryRepositoryを使用したメモリ内実行

### 3. deepModeling関数との統合
**目標**: `pnpm --filter @liam-hq/agent execute-deep-modeling:memory:debug`で行っていることを再現

**参考実装**: `@liam-hq/agent/scripts/executeDeepModelingProcess.ts`

**実装内容**:
- InMemoryRepositoryのセットアップ
- WorkflowStateの作成
- `deepModeling`関数の呼び出し
- 結果のSchema形式への変換

### 4. エラーハンドリングとロギング
**目標**: 実行時エラーの適切な処理とデバッグ情報の提供

**実装内容**:
- LangChainの実行エラーのキャッチ
- タイムアウト処理
- ログレベルの調整（デバッグ情報の抑制）
- 進行状況の表示

### 5. 出力形式の統一
**目標**: OpenAI executorと同じ形式でSchemaを出力

**実装内容**:
- `@liam-hq/db-structure`の`Schema`型から出力形式への変換
- テーブル、カラム、制約、外部キーの正規化
- OpenAI executorとの互換性確保

### 6. パフォーマンス最適化
**目標**: 実行時間の短縮（現在10分→目標3-5分）

**実装内容**:
- 不要なログの削除
- 並列処理の検討
- リソース使用量の最適化
- メモリリークの防止

### 7. テストの追加
**目標**: 品質保証とリグレッション防止

**実装内容**:
- `LiamDbExecutor`のユニットテスト
- エンドツーエンドテスト
- エラーケースのテスト
- パフォーマンステスト

## 実装順序

1. **Phase 1: 基本統合** (優先度: 高)
   - 依存関係の追加
   - `LiamDbExecutor`クラスの基本実装
   - `deepModeling`関数との最小限の統合

2. **Phase 2: 機能完成** (優先度: 高)
   - 出力形式の統一
   - エラーハンドリングの実装
   - 基本的なテストの追加

3. **Phase 3: 最適化** (優先度: 中)
   - パフォーマンス最適化
   - ログ改善
   - 詳細なテスト追加

## 技術的考慮事項

### メモリ使用量
- InMemoryRepositoryを使用するため、メモリ効率に注意
- 大きなスキーマでのメモリリークを避ける

### 実行時間
- 現在の`execute-deep-modeling:memory:debug`が4-10分かかる
- schema-benchでは複数ケースを実行するため、さらに最適化が必要

### 互換性
- OpenAI executorと同じインターフェースを維持
- 既存の評価システムとの互換性確保

## 期待される結果

- LiamDB executorによるベンチマーク実行
- OpenAIとの定量的比較が可能
- 継続的な品質評価の基盤

## リスク・課題

- 実行時間が長い（フィードバックループが遅い）
- LangChainのEventTarget警告問題
- メモリリークの可能性
- 複雑なエラーケースの処理

---

## 具体的な実装タスク (Phase 1: 基本統合)

### 📝 修正するファイル

#### 1. `frontend/internal-packages/schema-bench/package.json`
```json
{
  "dependencies": {
    "@huggingface/transformers": "3.3.3",
    "@liam-hq/agent": "workspace:*",        // ← 追加
    "@liam-hq/db-structure": "workspace:*", // ← 追加  
    "neverthrow": "8.2.0",
    "openai": "5.9.2",
    "valibot": "1.1.0"
  }
}
```

### 📁 新規作成するファイル

#### 2. `src/executors/liamDb/index.ts`
```typescript
export { LiamDbExecutor } from './liamDbExecutor.ts'
export type { LiamDbExecutorInput, LiamDbExecutorConfig } from './types.ts'
```

#### 3. `src/executors/liamDb/types.ts`
```typescript
import type { Result } from 'neverthrow'
import type { Schema } from '@liam-hq/db-structure'

export interface LiamDbExecutorInput {
  input: string  // テキストプロンプト
}

export interface LiamDbExecutorConfig {
  timeout?: number
  logLevel?: 'DEBUG' | 'INFO' | 'ERROR'
}

export interface LiamDbExecutorOutput {
  tables: Record<string, {
    name: string
    columns: Record<string, {
      name: string
      type: string
      // ...他のカラム情報
    }>
    // ...他のテーブル情報
  }>
}

export interface LiamDbExecutor {
  execute(input: LiamDbExecutorInput): Promise<Result<LiamDbExecutorOutput, Error>>
}
```

#### 4. `src/executors/liamDb/liamDbExecutor.ts`
```typescript
import type { Result } from 'neverthrow'
import { err, ok } from 'neverthrow'
import type { Schema } from '@liam-hq/db-structure'
import { deepModeling } from '@liam-hq/agent'

import type { 
  LiamDbExecutorInput, 
  LiamDbExecutorOutput, 
  LiamDbExecutorConfig 
} from './types.ts'

export class LiamDbExecutor {
  private config: LiamDbExecutorConfig

  constructor(config: LiamDbExecutorConfig = {}) {
    this.config = config
  }

  async execute(input: LiamDbExecutorInput): Promise<Result<LiamDbExecutorOutput, Error>> {
    try {
      // @liam-hq/agent の deepModeling 関数を呼び出し
      // InMemoryRepository のセットアップ
      // WorkflowState の作成
      // 結果の変換
      
      return ok(output)
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Unknown error'))
    }
  }

  private convertSchemaToOutput(schema: Schema): LiamDbExecutorOutput {
    // Schema型からLiamDbExecutorOutput型への変換
  }
}
```

#### 5. `src/executors/liamDb/liamDbExecutor.test.ts`
```typescript
import { describe, expect, it } from 'vitest'
import { LiamDbExecutor } from './liamDbExecutor.ts'

describe('LiamDbExecutor', () => {
  it('should create executor instance', () => {
    const executor = new LiamDbExecutor()
    expect(executor).toBeDefined()
  })

  it('should execute simple input', async () => {
    const executor = new LiamDbExecutor()
    const result = await executor.execute({
      input: 'Create a users table with id and name columns'
    })
    
    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.tables).toBeDefined()
    }
  })
})
```

### 🔧 修正するファイル

#### 6. `src/cli/executeLiamDb.ts`
```typescript
// 現在のプレースホルダー実装を、実際のLiamDbExecutorを使うように変更

import { LiamDbExecutor } from '../executors/liamDb/index.ts'

async function executeCase(
  executor: LiamDbExecutor,  // ← パラメータ追加
  caseId: string,
  input: LiamDbExecutorInput,
): Promise<Result<void, Error>> {
  const result = await executor.execute(input)  // ← 実際の実行
  if (result.isErr()) {
    return err(new Error(`Failed to execute ${caseId}: ${result.error.message}`))
  }

  const saveResult = await saveOutputFile(caseId, result.value)  // ← 実際の結果を保存
  // ...
}

async function main() {
  // ...
  const executor = new LiamDbExecutor()  // ← executor作成
  
  for (const { caseId, input } of inputs) {
    const result = await executeCase(executor, caseId, input)  // ← executor渡す
    // ...
  }
}
```

## 🔍 事前調査が必要なこと

1. **OpenAI executorの出力形式確認**
   ```bash
   cat benchmark-workspace/execution/output/case-001.json
   # → 実際の出力構造を把握
   ```

2. **@liam-hq/agentの実装確認**
   ```typescript
   // deepModeling関数のシグネチャを確認
   // InMemoryRepositoryの使用方法を確認
   // executeDeepModelingProcess.tsの実装を参考
   ```

3. **依存関係の競合チェック**
   ```bash
   pnpm install --filter @liam-hq/schema-bench
   ```

## 📋 実装順序

1. **package.jsonの依存関係追加** → 依存関係解決
2. **types.tsの作成** → 型定義確立  
3. **liamDbExecutor.tsの骨格作成** → 基本構造
4. **deepModeling関数との統合** → 実際の機能実装
5. **executeLiamDb.tsの修正** → CLIとの連携
6. **テストの追加** → 品質保証
7. **動作確認** → エンドツーエンドテスト
