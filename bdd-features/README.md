# Liam ERD BDD仕様書

このディレクトリには、Liam ERDプロジェクトのBehavior Driven Development (BDD) 仕様がGherkin形式で記述されています。

## 概要

Liam ERDは、データベーススキーマから美しいER図を自動生成するWebアプリケーションです。このBDD仕様書は、frontend以下のコードベースを精査して作成されており、実際のE2Eテストと整合性を保っています。

## 機能別仕様ファイル

### 1. [ERD可視化機能](./erd-visualization.feature)
- ページタイトル表示
- テーブルノードの選択とハイライト
- エッジアニメーション
- カーディナリティ表示
- リンクコピー機能

### 2. [表示モード切り替え機能](./display-modes.feature)
- Table Name モード（テーブル名のみ）
- Key Only モード（キーフィールドのみ）
- All Fields モード（全フィールド）
- URL状態管理

### 3. [ナビゲーションとブラウザ履歴機能](./navigation-and-history.feature)
- 表示モード変更の履歴管理
- テーブル選択の履歴管理
- テーブル非表示の履歴管理
- URLパラメータによる状態復元

### 4. [ツールバー操作機能](./toolbar-operations.feature)
- ズームイン・アウト
- レイアウト整理（Tidy up）
- 全体表示（Fit view）
- モバイル対応
- ズームレベル表示

### 5. [コマンドパレット機能](./command-palette.feature)
- Ctrl+Kでの起動
- テーブル検索と移動
- 部分一致検索
- 大文字小文字を区別しない検索
- モバイル環境での無効化

### 6. [スキーマ読み込み機能](./schema-loading.feature)
- 公開リポジトリからの読み込み
- プライベートリポジトリでのCLI使用
- 複数形式のサポート
- エラーハンドリング
- パフォーマンス最適化

### 7. [モバイル対応機能](./mobile-responsiveness.feature)
- レスポンシブレイアウト
- タッチ操作対応
- ピンチ・スワイプ操作
- 縦横画面対応
- パフォーマンス最適化

## 技術スタック

### フロントエンド
- **React 18** + **Next.js 15**: UIフレームワーク
- **TypeScript**: 型安全性
- **CSS Modules**: スタイリング
- **@xyflow/react**: ER図可視化
- **Valtio**: 状態管理

### テスト
- **Playwright**: E2Eテスト
- **Vitest**: ユニットテスト

### 開発ツール
- **pnpm**: パッケージ管理
- **Turborepo**: モノレポ管理
- **Biome**: リンティング・フォーマット

## BDD仕様の活用方法

### 1. 開発者向け
- 新機能開発時の要件定義として活用
- 実装前の仕様確認
- テストケース作成の参考

### 2. QA・テスター向け
- テストシナリオの作成
- 受け入れテストの実行
- バグ報告時の期待動作の明確化

### 3. プロダクトマネージャー向け
- 機能要件の確認
- ユーザーストーリーの検証
- リリース判定の基準

## 実装との対応関係

各BDD仕様は以下のE2Eテストファイルと対応しています：

- `frontend/internal-packages/e2e/tests/e2e/page.test.ts`
- `frontend/internal-packages/e2e/tests/e2e/navigation.test.ts`
- `frontend/internal-packages/e2e/tests/e2e/toolbar.test.ts`
- `frontend/internal-packages/e2e/tests/e2e/commandPalette.test.ts`

## 更新・メンテナンス

このBDD仕様書は、以下の場合に更新が必要です：

1. 新機能の追加
2. 既存機能の変更
3. E2Eテストの更新
4. ユーザーフィードバックによる要件変更

## 用語集

- **ERD**: Entity Relationship Diagram（実体関連図）
- **テーブルノード**: ER図上のテーブル表現
- **エッジ**: テーブル間の関連線
- **カーディナリティ**: テーブル間の関連の多重度
- **ハイライト**: 選択されたテーブルの強調表示
- **コマンドパレット**: Ctrl+Kで起動する検索・ナビゲーション機能

## 関連リンク

- [Liam ERD公式サイト](https://liambx.com)
- [ドキュメント](https://liambx.com/docs)
- [GitHubリポジトリ](https://github.com/liam-hq/liam)
- [ロードマップ](https://github.com/orgs/liam-hq/projects/1/views/1)
