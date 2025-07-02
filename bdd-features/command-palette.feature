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
