# TODO: App-UI Package Migration

## 目的
- Storybookのテストカバレッジを100%にする
- UIロジックをビジネスロジックから分離する
- 人間が見た目のみレビューし、実装はレビューせずとも済むようにする

## アーキテクチャ設計（アトミックデザイン）

### パッケージの役割分担
- **uiパッケージ** (`@liam-hq/ui`): Atoms/Molecules - 汎用的な基礎コンポーネント
- **app-uiパッケージ** (新規): Organisms - アプリ固有のUIパターン（状態管理含む）
- **appパッケージ**: Templates/Pages - ビジネスロジックとページ構成

### 責務の分離
1. **ui**: デザインシステムの基礎要素（Button, Input, Modal等）
2. **app-ui**: アプリ固有のUI状態管理とコンポーネント組み合わせ
3. **app**: API通信、データ変換、ビジネスルールの実装

## フェーズ1: パッケージセットアップ ✅
- [x] コンポーネントの分析と移行対象の特定
- [x] app-uiパッケージの作成 (`frontend/internal-packages/app-ui`)
- [x] package.jsonの設定
- [x] TypeScript設定
- [x] ビルド・テストスクリプトの設定
- [ ] gen:cssスクリプトの追加（CSS Modules用）

## フェーズ2: コンポーネント移行（並列作業可能）

### ボタンコンポーネントの汎用化と移行
- [x] ActionButton → 汎用アクションボタン（app-uiに移植完了）
- [x] AttachButton → 汎用添付ボタン（app-uiに移植完了）
- [ ] MicButton → 汎用マイクボタン
- [ ] CancelButton → 汎用キャンセルボタン
- [ ] SendButton → 汎用送信ボタン
- [ ] NewSessionButton → 汎用「新規作成」ボタン
- [ ] ThreadListButton → 汎用リストトグルボタン

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

## フェーズ4: テストとカバレッジ
- [ ] 移行したコンポーネントの包括的なテスト作成
- [ ] Storybookテストカバレッジツールの設定
- [ ] 100%カバレッジの達成と検証
- [ ] CI/CDでのカバレッジチェック設定

## 注意事項
- 既存のUIパッケージ (`@liam-hq/ui`) との整合性を保つ
- コンポーネントの汎用性を重視
- 後方互換性を考慮した移行
- ドキュメントの同時更新