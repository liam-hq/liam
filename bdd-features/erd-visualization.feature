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
