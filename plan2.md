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
