# PR分割計画: /appプレフィックス削除とルーティング再構築

## 元のIssue
- **Issue番号**: https://github.com/route06/liam-internal/issues/5576
- **目的**: 全URLから `/app` プレフィックスを削除し、URL構造を1階層浅くする
- **基準コミット**: 96b7370466aa517646e9f53846faae27f8aae815

## 現状の問題点
元のPR（e1f25ef40）が78ファイル、+151/-536行という大規模な変更になってしまい、レビューが困難。
複数の独立した変更が混在している。

## 推奨される分割プラン

### PR 1: GTM依存の削除とCookieConsent統合
**目的**: 外部依存を減らし、GTM機能を内製化
**ブランチ名**: `refactor/remove-gtm-dependency`
**依存**: なし（独立して実行可能）

**変更内容**:
- `@next/third-parties` パッケージの削除
- `libs/gtm/` ディレクトリの削除（5ファイル、計60行）
  - GtagScript.tsx (-16行)
  - GtmConsent.tsx (-23行)
  - updateConsent.ts (-14行)
  - index.ts (-4行)
  - constants.ts (-3行)
- `CookieConsent` コンポーネントへのGTM機能統合
- `types/global.d.ts` へのgtag型定義追加
- `app/layout.tsx` からGTM関連インポート削除

**影響ファイル数**: 約8ファイル
**削減行数**: 約60行
**メリット**: 他の変更から完全に独立。先にマージ可能。

---

### PR 2: 公開ページ機能の削除（要確認）
**目的**: 公開共有機能の削除（意図的かどうか要確認）
**ブランチ名**: `remove/public-pages`
**依存**: なし（独立して実行可能）

**変更内容**:
- `app/app/public/design_sessions/[id]/page.tsx` の削除（-27行）
- `components/PublicSessionDetailPage/` の削除（-153行）
- `components/PublicLayout/` の削除（全コンポーネント）
  - PublicAppBar/
  - PublicGlobalNav/
  - PublicLayout.tsx

**影響ファイル数**: 約10ファイル
**削減行数**: 約200行
**注意**: この変更は元に戻す可能性があるため、別PRとして分離

---

### PR 3: ディレクトリ構造の簡素化（ファイル移動）
**目的**: Next.jsのルートグループ構造を簡素化
**ブランチ名**: `refactor/simplify-route-structure`
**依存**: PR 1, 2のマージ後（コンフリクト回避）

**変更内容**:
- `app/(app)/app/(root)/` → `app/` への移動
- `app/(app)/app/(with-project)/` → `app/projects/` への移動
- `app/(app)/app/(with-project-and-branch)/` → `app/projects/[projectId]/ref/` への移動
- `app/(app)/app/design_sessions/` → `app/design_sessions/` への移動
- `app/(app)/app/auth/` → `app/auth/` への移動
- `app/(app)/app/confirm/` → `app/confirm/` への移動
- 重複ファイルの削除:
  - `app/app/login/page.tsx` (重複)
  - `app/(app)/app/(root)/layout.tsx` (CommonLayout呼び出し重複)
  - `layout.module.css` 削除

**影響ファイル数**: 約40ファイル（ほぼすべてがファイル移動）
**メリット**: ファイル移動がメインで、ロジック変更は最小限

---

### PR 4: /appプレフィックスの削除とURL更新
**目的**: URL定義から `/app` プレフィックスを削除
**ブランチ名**: `feat/remove-app-prefix`
**依存**: PR 3のマージ後

**変更内容**:
- `libs/routes/constants.ts` の `ROUTE_PREFIXES.APP` を空文字列に変更
- `libs/routes/routeDefinitions.ts` の全ルート定義から `/app` 削除
- コンポーネント内のハードコードされたパス修正:
  - `BranchDetailPage.tsx`: `/app/projects/` → `/projects/`
  - `UserDropdown.tsx`: `/app/login` → `/login`
  - 各種Server Actions内のリダイレクトパス
- `middleware.ts` のパスチェックロジック更新

**影響ファイル数**: 約15-20ファイル
**メリット**: URL変更のみに集中。機能テストがしやすい

---

### PR 5: 認証フローとレイアウトの調整
**目的**: 新しいルート構造に合わせた認証フローの最適化
**ブランチ名**: `fix/auth-flow-optimization`
**依存**: PR 4のマージ後

**変更内容**:
- `app/login/layout.tsx` の追加（空レイアウト）
- `CommonLayout.tsx` に認証ページスキップロジック追加
- OAuth コールバックURLの更新（`/app/auth/callback/` → `/auth/callback/`）
- `app/layout.tsx` の調整（GTM削除後のクリーンアップ）

**影響ファイル数**: 約5ファイル
**メリット**: 認証関連のみの小さな変更

---

## 実装順序の推奨

1. **PR 1** (独立): GTM削除 - 他と依存なし、すぐに進められる
2. **PR 2** (確認): 公開ページ削除 - 意図的な変更か確認後に実行
3. **PR 3** (基盤): ディレクトリ構造簡素化 - 主要な構造変更
4. **PR 4** (機能): /appプレフィックス削除 - Issueの主要要件
5. **PR 5** (仕上げ): 認証フロー調整 - 最後の微調整

## 各PRのテスト項目

### 共通テスト項目
- [ ] `pnpm dev` でアプリが起動する
- [ ] `pnpm build` が成功する
- [ ] `pnpm lint` が通る
- [ ] E2Eテストが通る

### PR固有のテスト項目

**PR 1 (GTM削除)**:
- [ ] Cookie同意バナーの表示
- [ ] CookieConsent内でGTM機能が動作すること

**PR 2 (公開ページ削除)**:
- [ ] `/public/design_sessions/[id]` が404になること
- [ ] 他のルートに影響がないこと

**PR 3-4 (ディレクトリ移動 & URL変更)**:
- [ ] 全主要ルートへのアクセス確認
- [ ] 404エラーが発生しないこと
- [ ] インポートパスが正しく解決されること

**PR 5 (認証フロー)**:
- [ ] ログイン/ログアウトフロー
- [ ] GitHub OAuth認証
- [ ] リダイレクトループが発生しないこと

## リスク軽減策

1. **段階的デプロイ**: 各PRを順次本番環境へデプロイ
2. **リバート計画**: 各PRは独立しているため、問題があれば個別にリバート可能
3. **旧URLリダイレクト**: PR 2の実装時に、旧URL（`/app/*`）から新URL（`/*`）へのリダイレクトを実装
4. **フィーチャーフラグ**: 必要に応じて、URL変更をフィーチャーフラグで制御

## 変更の内訳分析

元のPRの削減行数（-536行）の内訳：
- **GTM関連**: -60行（削除）
- **公開ページ機能**: -200行（削除）
- **重複レイアウト**: -47行（削除）
- **ファイル移動**: -約200行（見かけ上の削減）
- **その他の最適化**: -約30行

## 成功指標

- レビュー時間の短縮（各PR 30分以内）
- デプロイリスクの低減
- ロールバックの容易さ
- 各PRが独立してテスト可能

## 備考

- 元のコミット: e1f25ef40 (78ファイル、+151/-536行)
- 基準コミット: 96b7370466
- 公開ページ機能（`/public/design_sessions/[id]`）の削除は意図的でない場合、PR 2をスキップ
- PR 3（ディレクトリ移動）が最も大きいが、実質的にはファイル移動のみ