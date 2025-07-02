# TODO: App-UI Package Migration

## 目的（優先順位順）
1. **Storybookのテストカバレッジを100%にする**（最優先）
2. UIロジックをビジネスロジックから分離する
3. 人間が見た目のみレビューし、実装はレビューせずとも済むようにする

## アーキテクチャ設計（アトミックデザイン）

### パッケージの役割分担
- **uiパッケージ** (`@liam-hq/ui`): Atoms/Molecules - 汎用的な基礎コンポーネント
- **app-uiパッケージ** (新規): Organisms - アプリ固有のUIパターン（状態管理含む）
- **appパッケージ**: Templates/Pages - ビジネスロジックとページ構成

### 責務の分離
1. **ui**: デザインシステムの基礎要素（Button, Input, Modal等）
2. **app-ui**: アプリ固有のUI状態管理とコンポーネント組み合わせ
3. **app**: API通信、データ変換、ビジネスルールの実装

## フェーズ0: テストインフラ構築（最優先）

### Storybook v9へのアップグレード
- [x] Storybookを現在のv8からv9へアップグレード
- [x] 依存関係の更新と互換性確認
- [x] 既存のStoryファイルの動作確認

### Storybook Vitest Addon導入
- [x] @storybook/addon-vitestのインストールと設定
- [x] Vitest workspace設定（Storybookテスト専用）
- [x] ブラウザモードでのテスト実行環境構築
- [x] カバレッジレポート設定（100%目標）
- [ ] CI/CDでのカバレッジチェック設定

### テスト戦略
- [x] play関数によるインタラクションテスト方針策定（ActionButtonに実装例追加）
- [ ] テストタグ戦略の策定（include/exclude/skip）
- [ ] 既存コンポーネントへのテスト追加計画

### 既知の課題
- [ ] MicButton.stories.tsxの動的インポートエラー解決
- [ ] ActionButton.stories.tsxの動的インポートエラー解決
- [ ] Next.js Image コンポーネントのモック改善
- [ ] @liam-hq/db-structure パッケージの解決エラー修正

## フェーズ1: パッケージセットアップ ✅
- [x] コンポーネントの分析と移行対象の特定
- [x] app-uiパッケージの作成 (`frontend/internal-packages/app-ui`)
- [x] package.jsonの設定
- [x] TypeScript設定
- [x] ビルド・テストスクリプトの設定
- [x] gen:cssスクリプトの追加（CSS Modules用）
- [ ] vitest + testing-libraryで作成したテストを削除（Storybook Vitestに移行）
- [x] css.d.tsファイルをコミットしないよう.gitignoreに追加
- [x] app-uiパッケージのpackage.jsonからbuildコマンドを削除（内部パッケージのため不要）

## フェーズ2: コンポーネント移行（テストと並行実施）

### ボタンコンポーネントの汎用化と移行（各コンポーネントにテスト必須）
- [x] ActionButton → 汎用アクションボタン（app-uiに移植完了）
  - [x] play関数によるインタラクションテスト追加（3つの状態テスト実装）
  - [ ] カバレッジ100%達成（動的インポートエラー解決後）
- [x] AttachButton → 汎用添付ボタン（app-uiに移植完了）
  - [ ] play関数によるインタラクションテスト追加
  - [x] テスト実行確認（1テスト合格）
- [x] MicButton → 汎用マイクボタン（app-uiに移植完了）
  - [x] play関数によるインタラクションテスト追加（既存実装あり）
  - [ ] カバレッジ100%達成（動的インポートエラー解決後）
- [x] CancelButton → 汎用キャンセルボタン（app-uiに移植完了）
  - [x] play関数によるインタラクションテスト追加
  - [x] カバレッジ100%達成
- [ ] SendButton → 汎用送信ボタン（テスト込み）
- [ ] NewSessionButton → 汎用「新規作成」ボタン（テスト込み）
- [ ] ThreadListButton → 汎用リストトグルボタン（テスト込み）

## フェーズ3: リファクタリング

### UI/ロジック分離が必要なコンポーネント
- [ ] チャットコンポーネント
  - [ ] AgentMessage
  - [ ] UserMessage
  - [ ] MessageOptionButton
  - [ ] ProcessIndicator
- [ ] チャット入力コンポーネント
  - [ ] ChatInput
  - [ ] MentionSuggestor
- [ ] フォームプレゼンター
  - [ ] SessionFormPresenter
  - [ ] GitHubSessionFormPresenter
  - [ ] URLSessionFormPresenter
  - [ ] UploadSessionFormPresenter
  - [ ] SessionFormActions
  - [ ] SessionModeSelector
  - [ ] DeepModelingToggle

### リファクタリング手法
- [ ] Presentational/Container コンポーネントパターンの適用
- [ ] ビジネスロジックのカスタムフックへの抽出
- [ ] 状態管理の分離
- [ ] サービスモジュールの作成

## フェーズ4: 最終検証とメンテナンス
- [ ] 全コンポーネントのカバレッジ100%検証
- [ ] テストメンテナンス方針の策定
- [ ] ドキュメント更新（テスト方針含む）

## 現在の進捗状況
- ✅ Storybook v9アップグレード完了
- ✅ Vitest Addon導入・設定完了
- ✅ 134テスト合格（25/27ストーリーファイル）
- ⚠️  2ファイルで動的インポートエラー（解決必要）
- 📊 カバレッジレポート設定済み（100%目標）

## 注意事項
- 既存のUIパッケージ (`@liam-hq/ui`) との整合性を保つ
- コンポーネントの汎用性を重視
- 後方互換性を考慮した移行
- ドキュメントの同時更新