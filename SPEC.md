# Liam ERD BDD仕様書

このドキュメントには、Liam ERDプロジェクトのBehavior Driven Development (BDD) 仕様がGherkin形式で記述されています。

## 概要

Liam ERDは、データベーススキーマから美しいER図を自動生成するWebアプリケーションです。このBDD仕様書は、frontend以下のコードベースを精査して作成されており、実際のE2Eテストと整合性を保っています。

## 機能別仕様

### 1. ERD可視化機能

```gherkin
Feature: ERD可視化機能
  As a データベース開発者
  I want to データベーススキーマからER図を表示できる
  So that データベース構造を視覚的に理解できる

  Background:
    Given ユーザーがLiam ERDアプリケーションにアクセスしている
    And データベーススキーマが読み込まれている

  Scenario: ページタイトルの表示
    When ユーザーがアプリケーションを開く
    Then ページタイトルに "Liam ERD" が含まれている

  Scenario: テーブルノードの選択とハイライト
    Given ERD画面が表示されている
    When ユーザーが "accounts" テーブルノードをクリックする
    Then そのテーブルノードがハイライト表示される
    And URLに "active=accounts" パラメータが追加される

  Scenario: エッジアニメーションの表示
    Given ERD画面が表示されている
    When ユーザーが "account_aliases" テーブルノードをクリックする
    Then "accounts" から "account_aliases" へのエッジにアニメーションが表示される
    And エッジの楕円要素が表示される

  Scenario: カーディナリティのハイライト
    Given ERD画面が表示されている
    When ユーザーが "account_aliases" テーブルノードをクリックする
    Then "accounts" から "account_aliases" へのエッジのカーディナリティがハイライト表示される
    And マーカーが通常の状態からハイライト状態に変更される

  Scenario: リンクコピー機能
    Given ERD画面が表示されている
    And ユーザーがデスクトップ環境を使用している
    When ユーザーがコピーリンクボタンをクリックする
    Then 現在のURLがクリップボードにコピーされる
```

### 2. 表示モード切り替え機能

```gherkin
Feature: 表示モード切り替え機能
  As a データベース開発者
  I want to テーブルの表示内容を切り替えられる
  So that 必要な情報レベルに応じてER図を見ることができる

  Background:
    Given ユーザーがLiam ERDアプリケーションにアクセスしている
    And データベーススキーマが読み込まれている
    And ERD画面が表示されている

  Scenario: Table Name モードでの表示
    Given 表示モードボタンをクリックしている
    When ユーザーが "Table Name" オプションを選択する
    Then テーブルノードにはテーブル名のみが表示される
    And カラム情報は表示されない

  Scenario: Key Only モードでの表示
    Given 表示モードボタンをクリックしている
    When ユーザーが "Key Only" オプションを選択する
    Then テーブルノードにはキーフィールドのみが表示される
    And "lists" テーブルに以下のカラムが表示される:
      | カラム名 |
      | idbigserial |
      | account_idbigint |
    And 通常のカラム（username等）は表示されない

  Scenario: All Fields モードでの表示
    Given 表示モードボタンをクリックしている
    When ユーザーが "All Fields" オプションを選択する
    Then テーブルノードには全てのフィールドが表示される
    And "lists" テーブルに以下のカラムが表示される:
      | カラム名 |
      | idbigserial |
      | account_idbigint |
      | titlevarchar |
      | created_attimestamp |
      | updated_attimestamp |
      | replies_policyinteger |
      | exclusiveboolean |

  Scenario: 表示モード変更時のURL更新
    Given 表示モードボタンをクリックしている
    When ユーザーが "All Fields" オプションを選択する
    Then URLに "showMode=ALL_FIELDS" パラメータが追加される

  Scenario: 表示モード変更時のフィールド表示切り替え
    Given 表示モードが "All Fields" に設定されている
    And "accounts" テーブルの "username" カラムが表示されている
    When ユーザーが表示モードを "Key Only" に変更する
    Then "accounts" テーブルの "username" カラムが非表示になる
```

### 3. ナビゲーションとブラウザ履歴機能

```gherkin
Feature: ナビゲーションとブラウザ履歴機能
  As a データベース開発者
  I want to ブラウザの戻る・進むボタンでER図の状態を管理できる
  So that 操作履歴を辿って効率的にER図を探索できる

  Background:
    Given ユーザーがLiam ERDアプリケーションにアクセスしている
    And データベーススキーマが読み込まれている
    And ERD画面が表示されている
    And ユーザーがデスクトップ環境を使用している

  Scenario: 表示モード変更のブラウザ履歴管理
    Given 初期状態でER図が表示されている
    When ユーザーが表示モードを "All Fields" に変更する
    Then URLに "showMode=ALL_FIELDS" が含まれる
    When ユーザーが表示モードを "Key Only" に変更する
    Then URLに "showMode=KEY_ONLY" が含まれる
    And "accounts" テーブルの "username" カラムが非表示になる
    When ユーザーがブラウザの戻るボタンをクリックする
    Then URLに "showMode=ALL_FIELDS" が含まれる
    And "accounts" テーブルの "username" カラムが表示される
    When ユーザーがブラウザの進むボタンをクリックする
    Then URLに "showMode=KEY_ONLY" が含まれる
    And "accounts" テーブルの "username" カラムが非表示になる

  Scenario: テーブル選択のブラウザ履歴管理
    Given 初期状態でER図が表示されている
    When ユーザーが "accounts" テーブルをクリックする
    Then URLに "active=accounts" が含まれる
    And "accounts" テーブルがハイライト表示される
    When ユーザーが "users" テーブルをクリックする
    Then URLに "active=users" が含まれる
    When ユーザーがブラウザの戻るボタンをクリックする
    Then URLに "active=accounts" が含まれる
    When ユーザーがブラウザの進むボタンをクリックする
    Then URLに "active=users" が含まれる

  Scenario: テーブル非表示のブラウザ履歴管理
    Given 初期状態でER図が表示されている
    And "accounts" テーブルが表示されている
    When ユーザーがサイドバーを開く
    And ユーザーが "accounts" テーブルの非表示ボタンをクリックする
    Then URLに "hidden=eJxLTE7OL80rKQYADrsDYQ" が含まれる
    And "accounts" テーブルが非表示になる
    When ユーザーがブラウザの戻るボタンをクリックする
    Then "accounts" テーブルが表示される
    And URLに "hidden=" パラメータが含まれない
    When ユーザーがブラウザの進むボタンをクリックする
    Then URLに "hidden=eJxLTE7OL80rKQYADrsDYQ" が含まれる
    And "accounts" テーブルが非表示になる

  Scenario: URLパラメータによる状態復元
    Given ユーザーが "showMode=KEY_ONLY&active=accounts" パラメータ付きのURLにアクセスする
    Then 表示モードが "Key Only" に設定されている
    And "accounts" テーブルがハイライト表示される
    And "accounts" テーブルの "username" カラムが非表示になる
```

### 4. ツールバー操作機能

```gherkin
Feature: ツールバー操作機能
  As a データベース開発者
  I want to ツールバーを使ってER図の表示を調整できる
  So that 最適な視点でデータベース構造を確認できる

  Background:
    Given ユーザーがLiam ERDアプリケーションにアクセスしている
    And データベーススキーマが読み込まれている
    And ERD画面が表示されている
    And ローディングが完了している

  Scenario: ツールバーの表示確認
    Given ERD画面が表示されている
    Then ツールバーが表示されている

  Scenario: モバイル環境でのツールバー表示
    Given ユーザーがモバイル環境を使用している
    When ユーザーがツールバー開くボタンをクリックする
    Then ツールバーが表示される

  Scenario: ズームイン機能
    Given ツールバーが表示されている
    And 現在のズームレベルを確認している
    When ユーザーがズームインボタンをクリックする
    Then ズームレベルが増加する
    And ER図が拡大表示される

  Scenario: ズームアウト機能
    Given ツールバーが表示されている
    And 事前にズームインしている
    And 現在のズームレベルを確認している
    When ユーザーがズームアウトボタンをクリックする
    Then ズームレベルが減少する
    And ER図が縮小表示される

  Scenario: レイアウト整理機能
    Given ツールバーが表示されている
    And ユーザーがデスクトップ環境を使用している
    And "accounts" テーブルの初期位置を確認している
    When ユーザーが "accounts" テーブルを別の位置にドラッグする
    Then テーブルの位置が変更される
    When ユーザーがレイアウト整理ボタンをクリックする
    Then "accounts" テーブルが初期位置に戻る
    And 全てのテーブルが整理された配置になる

  Scenario: 全体表示機能
    Given ツールバーが表示されている
    And ユーザーがデスクトップ環境を使用している
    And "accounts" テーブルがビューポート内に表示されている
    When ユーザーがズームインボタンを10回クリックする
    Then "accounts" テーブルがビューポート外に移動する
    When ユーザーが全体表示ボタンをクリックする
    Then "accounts" テーブルがビューポート内に表示される
    And 全てのテーブルが画面内に収まる

  Scenario Outline: 表示モード切り替え
    Given ツールバーが表示されている
    And ユーザーがデスクトップ環境を使用している
    When ユーザーが表示モードボタンをクリックする
    And ユーザーが "<モード>" オプションを選択する
    Then "lists" テーブルに以下のカラムが表示される:
      <期待されるカラム>

    Examples:
      | モード      | 期待されるカラム |
      | Table Name  | なし |
      | Key Only    | idbigserial, account_idbigint |
      | All Fields  | idbigserial, account_idbigint, titlevarchar, created_attimestamp, updated_attimestamp, replies_policyinteger, exclusiveboolean |

  Scenario: ズームレベル表示の更新
    Given ツールバーが表示されている
    And ズームレベル表示が "100%" と表示されている
    When ユーザーがズームインボタンをクリックする
    Then ズームレベル表示が "100%" より大きい値に更新される
    When ユーザーがズームアウトボタンをクリックする
    Then ズームレベル表示が前の値より小さい値に更新される
```

### 5. コマンドパレット機能

```gherkin
Feature: コマンドパレット機能
  As a データベース開発者
  I want to コマンドパレットを使って素早くテーブルを検索・移動できる
  So that 大きなデータベースでも効率的にテーブルを見つけることができる

  Background:
    Given ユーザーがLiam ERDアプリケーションにアクセスしている
    And データベーススキーマが読み込まれている
    And ERD画面が表示されている
    And ユーザーがデスクトップ環境を使用している

  Scenario: コマンドパレットの起動
    Given ERD画面が表示されている
    When ユーザーが "Ctrl+K" キーを押す
    Then コマンドパレットダイアログが表示される
    And ダイアログのタイトルが "Command Palette" である

  Scenario: テーブル検索と移動
    Given ERD画面が表示されている
    When ユーザーが "Ctrl+K" キーを押す
    Then コマンドパレットダイアログが表示される
    When ユーザーが "user_roles" と入力する
    And ユーザーが "Enter" キーを押す
    Then コマンドパレットダイアログが閉じる
    And URLに "active=user_roles" パラメータが追加される
    And "user_roles" テーブルがハイライト表示される

  Scenario: 部分一致でのテーブル検索
    Given ERD画面が表示されている
    When ユーザーが "Ctrl+K" キーを押す
    Then コマンドパレットダイアログが表示される
    When ユーザーが "user" と入力する
    Then 検索結果に "users" テーブルが表示される
    And 検索結果に "user_roles" テーブルが表示される

  Scenario: 存在しないテーブル名での検索
    Given ERD画面が表示されている
    When ユーザーが "Ctrl+K" キーを押す
    Then コマンドパレットダイアログが表示される
    When ユーザーが "nonexistent_table" と入力する
    Then 検索結果に該当するテーブルが表示されない
    And "該当するテーブルが見つかりません" メッセージが表示される

  Scenario: コマンドパレットのキャンセル
    Given ERD画面が表示されている
    When ユーザーが "Ctrl+K" キーを押す
    Then コマンドパレットダイアログが表示される
    When ユーザーが "Escape" キーを押す
    Then コマンドパレットダイアログが閉じる
    And URLに変更がない

  Scenario: モバイル環境でのコマンドパレット無効化
    Given ユーザーがモバイル環境を使用している
    And ERD画面が表示されている
    When ユーザーがタッチ操作でコマンドパレットを起動しようとする
    Then コマンドパレット機能は利用できない
    And 代替の検索方法が提供される

  Scenario: 大文字小文字を区別しない検索
    Given ERD画面が表示されている
    When ユーザーが "Ctrl+K" キーを押す
    Then コマンドパレットダイアログが表示される
    When ユーザーが "ACCOUNTS" と入力する
    Then 検索結果に "accounts" テーブルが表示される
    When ユーザーが "Enter" キーを押す
    Then URLに "active=accounts" パラメータが追加される
```

### 6. スキーマ読み込み機能

```gherkin
Feature: スキーマ読み込み機能
  As a データベース開発者
  I want to 様々な形式のデータベーススキーマを読み込める
  So that 既存のプロジェクトのER図を簡単に生成できる

  Background:
    Given ユーザーがLiam ERDアプリケーションにアクセスしている

  Scenario: 公開リポジトリのスキーマファイル読み込み
    Given ユーザーが公開GitHubリポジトリのスキーマファイルURLを持っている
    When ユーザーがURLに "liambx.com/erd/p/" プレフィックスを追加する
    And 修正されたURLにアクセスする
    Then スキーマファイルが正常に読み込まれる
    And ER図が表示される

  Scenario: プライベートリポジトリでのCLI使用
    Given ユーザーがプライベートリポジトリを使用している
    When ユーザーが "npx @liam-hq/cli init" コマンドを実行する
    Then インタラクティブなセットアップが開始される
    And ローカル環境でER図が生成される

  Scenario: サポートされているスキーマ形式の読み込み
    Given ユーザーが以下のいずれかの形式のスキーマファイルを持っている:
      | 形式 | 拡張子 |
      | Ruby on Rails | schema.rb |
      | Django | models.py |
      | Laravel | migration files |
      | SQL DDL | .sql |
    When ユーザーがスキーマファイルを指定する
    Then 形式が自動検出される
    And 適切なパーサーが選択される
    And スキーマが正常に解析される

  Scenario: 無効なスキーマファイルの処理
    Given ユーザーが無効な形式のファイルを指定している
    When スキーマ読み込みを試行する
    Then エラーメッセージが表示される
    And "サポートされていない形式です" という内容が含まれる
    And サポートされている形式の一覧が表示される

  Scenario: 大きなスキーマファイルの読み込み
    Given ユーザーが100以上のテーブルを含む大きなスキーマファイルを持っている
    When スキーマファイルを読み込む
    Then ローディングインジケーターが表示される
    And 段階的にテーブルが表示される
    And パフォーマンスが最適化されている

  Scenario: ネットワークエラー時の処理
    Given ユーザーがリモートスキーマファイルを読み込もうとしている
    And ネットワーク接続に問題がある
    When スキーマ読み込みを試行する
    Then 適切なエラーメッセージが表示される
    And リトライオプションが提供される

  Scenario: スキーマファイルの更新検知
    Given ユーザーがスキーマファイルを読み込んでいる
    And 元のスキーマファイルが更新されている
    When ページを再読み込みする
    Then 最新のスキーマ内容が反映される
    And 変更されたテーブル構造が表示される

  Scenario: 複数データベースのスキーマ統合
    Given ユーザーが複数のデータベーススキーマファイルを持っている
    When 複数のスキーマファイルを同時に読み込む
    Then 統合されたER図が表示される
    And データベース間の関連が適切に表示される
    And 各テーブルの所属データベースが識別される
```

### 7. モバイル対応機能

```gherkin
Feature: モバイル対応機能
  As a モバイルデバイスを使用するデータベース開発者
  I want to モバイル環境でもER図を快適に閲覧・操作できる
  So that 場所を選ばずにデータベース構造を確認できる

  Background:
    Given ユーザーがモバイルデバイスを使用している
    And Liam ERDアプリケーションにアクセスしている
    And データベーススキーマが読み込まれている

  Scenario: モバイル環境でのページ表示
    Given ユーザーがモバイルブラウザでアプリケーションを開く
    When ページが読み込まれる
    Then ページタイトルに "Liam ERD" が含まれている
    And モバイル向けのレスポンシブレイアウトが適用される
    And タッチ操作に最適化されたUI要素が表示される

  Scenario: モバイル環境でのツールバー表示
    Given ERD画面が表示されている
    And ツールバーが初期状態では非表示になっている
    When ユーザーがツールバー開くボタンをタップする
    Then ツールバーが表示される
    And モバイル向けのツールバーレイアウトが適用される

  Scenario: タッチ操作でのテーブル選択
    Given ERD画面が表示されている
    When ユーザーが "accounts" テーブルノードをタップする
    Then そのテーブルノードがハイライト表示される
    And URLに "active=accounts" パラメータが追加される
    And タッチフィードバックが提供される

  Scenario: ピンチ操作でのズーム
    Given ERD画面が表示されている
    When ユーザーがピンチアウト操作を行う
    Then ER図が拡大表示される
    When ユーザーがピンチイン操作を行う
    Then ER図が縮小表示される

  Scenario: スワイプ操作でのパン
    Given ERD画面が表示されている
    And ER図が表示されている
    When ユーザーが画面をスワイプする
    Then ER図の表示位置が移動する
    And スムーズなスクロール動作が実行される

  Scenario: モバイル環境での表示モード切り替え
    Given ERD画面が表示されている
    And ツールバーが表示されている
    When ユーザーが表示モードボタンをタップする
    Then モバイル向けの選択メニューが表示される
    When ユーザーが "Key Only" オプションをタップする
    Then テーブルノードにキーフィールドのみが表示される

  Scenario: モバイル環境でのコマンドパレット無効化
    Given ERD画面が表示されている
    When ユーザーがコマンドパレットを起動しようとする
    Then コマンドパレット機能は利用できない
    And 代替として検索機能が提供される

  Scenario: 縦向き・横向き画面の対応
    Given ERD画面が表示されている
    And デバイスが縦向きモードになっている
    When ユーザーがデバイスを横向きに回転させる
    Then レイアウトが横向きモードに適応される
    And ER図の表示領域が最適化される
    And ツールバーの配置が調整される

  Scenario: モバイル環境でのパフォーマンス最適化
    Given 大きなスキーマファイル（100以上のテーブル）が読み込まれている
    When モバイルデバイスでER図を表示する
    Then レンダリングパフォーマンスが最適化されている
    And 必要に応じて表示要素が間引かれる
    And スムーズな操作が維持される

  Scenario: タッチ操作でのテーブル移動制限
    Given ERD画面が表示されている
    And ユーザーがテーブルノードをタップしている
    When ユーザーがドラッグ操作を試行する
    Then テーブルの移動機能は無効化されている
    And 代わりに選択・ハイライト機能が動作する

  Scenario: モバイル環境でのエラーハンドリング
    Given ネットワーク接続が不安定な状況である
    When スキーマファイルの読み込みでエラーが発生する
    Then モバイル向けのエラーメッセージが表示される
    And リトライボタンがタップしやすいサイズで表示される
    And オフライン対応の案内が提供される
```

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
