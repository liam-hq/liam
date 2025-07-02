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
