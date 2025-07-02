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
