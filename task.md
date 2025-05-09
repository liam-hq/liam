# er-diagram-chat 移植計画

## 概要

`er-diagram-chat`をLiamプロジェクトの`frontend/apps/app/app/(app)/app/(with-project-and-branch)/projects/[projectId]/ref/[branchOrCommit]/build/page.tsx`に移植する計画です。

## ソースプロジェクト分析

`er-diagram-chat`は以下の機能を持つNext.jsアプリケーションです：
- ReactFlowを使用したERダイアグラムエディタ
- スレッド機能を持つチャットインターフェース
- ダイアグラム状態のバージョン管理

## 移植手順

### 1. コンポーネント構造の作成

- [ ] Liamプロジェクトのディレクトリ構造ガイドラインに従って、BuildPageコンポーネントを作成する
  ```
  frontend/apps/app/components/BuildPage/
  ├─ index.ts
  ├─ BuildPage.tsx
  ├─ BuildPage.module.css
  ├─ hooks/
  │  ├─ useERDChat.ts
  │  └─ ...
  ├─ components/
  │  ├─ ChatInterface/
  │  ├─ ThreadView/
  │  └─ ...
  ```

### 2. ERD機能の適応

- [ ] 既存の`@liam-hq/erd-core`パッケージを活用する
  - [ ] `ERDRenderer`と`ERDContent`コンポーネントを使用
  - [ ] 必要に応じてチャット固有のノードタイプを拡張

### 3. チャットコンポーネントの移植

- [ ] チャットインターフェースコンポーネントをCSS Modulesを使用するように変換
  - [ ] ChatInterfaceコンポーネント
  - [ ] ThreadViewコンポーネント
  - [ ] ChatNodeコンポーネント
  - [ ] ChatInputNodeコンポーネント
- [ ] Radix UIコンポーネントを`@liam-hq/ui`の同等のものに置き換え
- [ ] メッセージスレッド機能を実装

### 4. 状態管理の実装

- [ ] チャット状態を管理するためのカスタムフックを作成
- [ ] `@liam-hq/erd-core`の状態管理と統合
- [ ] バージョン管理機能を実装

### 5. ページコンポーネントの作成

- [ ] 目的のパスにBuildPageコンポーネントをインポートする薄いラッパーを作成
  ```typescript
  // frontend/apps/app/app/(app)/app/(with-project-and-branch)/projects/[projectId]/ref/[branchOrCommit]/build/page.tsx
  import { BuildPage } from "@/components/BuildPage"

  export default function Page() {
    return <BuildPage />
  }
  ```

## 技術的考慮事項

- [ ] **API統合**: ソースプロジェクトはモックデータとシミュレートされたレスポンスを使用。実際のAPIと統合する必要がある
- [ ] **TypeScriptの型**: 特にERD関連のデータについて、ソースプロジェクトの型と宛先プロジェクトの型の互換性を確保
- [ ] **CSSアプローチ**: TailwindからCSS Modulesに変換し、プロジェクトのスタイリングガイドラインに従う
- [ ] **コンポーネントの命名**: 宛先プロジェクトの命名規則に従う（例：名前付きエクスポート、説明的な名前）
- [ ] **アクセシビリティ**: すべてのコンポーネントがアクセシビリティ機能を維持または改善することを確認

## テスト戦略

- [ ] 個々のコンポーネントの単体テスト
- [ ] ERDとチャット機能の相互作用の統合テスト
- [ ] 完全なワークフローのエンドツーエンドテスト
