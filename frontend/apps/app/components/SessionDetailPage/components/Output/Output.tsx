import { TabsContent, TabsRoot } from '@/components'
import type { Schema } from '@liam-hq/db-structure'
import type { FC } from 'react'
import styles from './Output.module.css'
import { Artifact } from './components/Artifact'
import { DBDesign } from './components/DBDesign'
import { Header } from './components/Header'
import { DEFAULT_OUTPUT_TAB, OUTPUT_TABS } from './constants'

// テスト用のサンプルマークダウンコンテンツ
const sampleContent = `## 全体分析

このデータベース設計は、アプリケーションの説明から抽出されたビジネス要件と機能要件を満たしています。設計は、アプリケーションの説明、要件の抽出、データベース設計の生成、検証結果の保存など、すべての主要な機能をサポートしています。各テーブルは適切に正規化されており、必要なリレーションシップが確立されています。

## ビジネス要件と検証結果

### BR1

ユーザーがアプリケーションの説明を入力し、データベース設計を生成できること

#### 検証結果

applicationsテーブルがユーザーのアプリケーション説明を保存し、database_designsテーブルが生成されたデータベース設計を保存します。

関連テーブル： \`applications\` \`database_designs\`

<details><summary>DMLサンプルを表示</summary>
<p>

\`\`\`sql
INSERT INTO applications (id, description)
VALUES
  ('123e4567-e89b-12d3-a456-426614174000', 'Eコマースプラットフォームの開発');
\`\`\`

</p>
</details>

### BR2

ユーザーがデータベース設計の履歴を管理できること

#### 検証結果

database_designsテーブルがバージョン管理機能を提供し、design_versionsテーブルが各設計の履歴を追跡します。

関連テーブル： \`database_designs\` \`design_versions\`

<details><summary>DMLサンプルを表示</summary>
<p>

\`\`\`sql
INSERT INTO design_versions (id, design_id, version_number, schema_content)
VALUES
  ('456e7890-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174000', 2, '{"tables": []}');
\`\`\`

</p>
</details>

### BR3

データベース設計の検証レポートを生成できること

#### 検証結果

validation_reportsテーブルが検証結果を保存し、validation_issuesテーブルが個別の問題を追跡します。

関連テーブル： \`validation_reports\` \`validation_issues\`

<details><summary>DMLサンプルを表示</summary>
<p>

\`\`\`sql
INSERT INTO validation_reports (id, design_id, status, report_data)
VALUES
  ('789e0123-e89b-12d3-a456-426614174002', '123e4567-e89b-12d3-a456-426614174000', 'completed', '{"issues": 3, "warnings": 1}');
\`\`\`

</p>
</details>

## 機能要件と検証結果

### FR1

ユーザーがアプリケーションの説明を入力するフォームを提供すること

#### 検証結果

applicationsテーブルがフォーム入力されたアプリケーション説明を適切に保存し、データの整合性を保っています。

関連テーブル： \`applications\`

<details><summary>DMLサンプルを表示</summary>
<p>

\`\`\`sql
SELECT id, description, created_at, updated_at
FROM applications
WHERE id = '123e4567-e89b-12d3-a456-426614174000';
\`\`\`

</p>
</details>

### FR2

データベース設計の履歴を一覧表示する機能を提供すること

#### 検証結果

design_versionsテーブルとdatabase_designsテーブルの結合により、設計の変更履歴を時系列で効率的に取得できます。

関連テーブル： \`design_versions\` \`database_designs\`

<details><summary>DMLサンプルを表示</summary>
<p>

\`\`\`sql
SELECT dv.version_number, dv.created_at, dd.name
FROM design_versions dv
JOIN database_designs dd ON dv.design_id = dd.id
WHERE dd.application_id = '123e4567-e89b-12d3-a456-426614174000'
ORDER BY dv.created_at DESC;
\`\`\`

</p>
</details>

### FR3

検証レポートをエクスポートする機能を提供すること

#### 検証結果

validation_reportsテーブルとvalidation_issuesテーブルの結合により、検証レポートの詳細情報と個別の問題点を包括的に取得できます。

関連テーブル： \`validation_reports\` \`validation_issues\`

<details><summary>DMLサンプルを表示</summary>
<p>

\`\`\`sql
SELECT vr.status, vr.report_data, vi.severity, vi.description
FROM validation_reports vr
LEFT JOIN validation_issues vi ON vr.id = vi.report_id
WHERE vr.design_id = '123e4567-e89b-12d3-a456-426614174000';
\`\`\`

</p>
</details>

## DB Design Review

### Migration Safety

severity:Medium

DDL はすべて **CREATE TABLE** で破壊的操作は含まず安全性は高め。
ただし **トランザクション境界の宣言** がないため、大量データの後続マイグレーション（カラム追加＋データ移行など）を含める場合は **BEGIN … COMMIT;** でラップし、ツール (Sqitch, Rails migrations, golang-migrate 等) の **fail-fast & auto-rollback** 機構を必ず使うことを推奨。

### Data Integrity

severity:Low

すべての FK に **参照整合性制約** を設定、UNIQUE (channel_id, user_id) など重複防止も OK。
ソフトデリート採用で履歴保持の要件を満たす。
今後のリリースで **NOT NULL -> NULLABLE 変更** が発生する場合は ① バックフィル ② 制約緩和 の 2 ステップに分割する "expand-migrate-contract" 戦略が安全。

### Performance Impact

severity:Medium

読み取り系は主要 FK & 検索キーにインデックスを付与しておりベースラインとしては良好。
**messages テーブルの肥大化** がボトルネックになりやすい。メンテ予定があるなら PARTITION BY HASH (channel_id) など水平パーティションを検討。
message_reactions の高頻度書き込みは **UNIQUE (message_id, user_id, emoji)** が競合になり得るため、同一キーに対して "INSERT … ON CONFLICT" を利用し **UPSERT** 設計を確認。

### Security or Scalability

severity:Medium

**Security:** 現状パスワードカラムはなく、OAuth 連携等で外部認証を想定しているため平文パスワード保存リスクなし。
**RBAC** を拡張する場合、channel_memberships.role 以外に **行レベルセキュリティ (RLS)** を導入し、プライベートチャンネルを DB レイヤで強制する設計も視野に。
**Scalability:** 全テーブルとも BIGINT 主キーで 2^63-1 件まで対応。将来的に 1 テーブル 10^9 行級となる場合は、
1) **Auto-VACUUM / REINDEX ポリシー** の調整
2) **論理レプリケーション + リードレプリカ分散**
3) messages のパーティション or ショーディング
を計画段階でロードマップ化しておくと安心。

### Project Rules Consistency

severity:Low

すべて **snake_case**・名詞複数形・created_at / updated_at / deleted_at のタイムスタンプ列を採用。
既存ドキュメントで指定されている接頭辞・型ポリシーと一致しているため問題なし。`

type Props = {
  schema: Schema
  artifactContent?: string
}

export const Output: FC<Props> = ({ schema, artifactContent }) => {
  return (
    <TabsRoot defaultValue={DEFAULT_OUTPUT_TAB} className={styles.wrapper}>
      <Header />
      <div className={styles.body}>
        <TabsContent value={OUTPUT_TABS.DB_DESIGN}>
          <DBDesign schema={schema} />
        </TabsContent>
        <TabsContent value={OUTPUT_TABS.ARTIFACT}>
          <Artifact content={artifactContent || sampleContent} />
        </TabsContent>
      </div>
    </TabsRoot>
  )
}
