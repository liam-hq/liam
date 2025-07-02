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
