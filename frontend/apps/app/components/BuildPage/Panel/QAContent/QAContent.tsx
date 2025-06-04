'use client'

import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '@/components'
import type { FC } from 'react'
import { useState } from 'react'
import styles from './QAContent.module.css'

type UseCaseExecution = {
  id: string
  title: string
  status: 'PASSED' | 'FAILED' | 'UNDER_REVIEW'
  testResult: string
  brdRequirements: Array<{
    id: string
    description: string
  }>
  relatedDb: string[]
  adjustmentHistory: Array<{
    timestamp: string
    change: string
    reason: string
  }>
  testDetails: Array<{
    step: number
    title: string
    description: string
    sqlQuery: string
    expectedResult: string
    actualResult?: string
    tableResult?: {
      columns: string[]
      rows: Array<Record<string, string | number>>
    }
  }>
}

type ReviewCategory =
  | 'USE_CASES'
  | 'PERFORMANCE'
  | 'SECURITY'
  | 'MIGRATION_SAFETY'
  | 'DATA_INTEGRITY'

type TestCase = {
  id: string
  name: string
  category: ReviewCategory
  status: 'PASSED' | 'FAILED' | 'RUNNING' | 'PENDING'
  duration?: string
  description: string
  details: string
  sqlQuery?: string
  expectedResult?: string
  actualResult?: string
  errorMessage?: string
  adjustmentHistory?: Array<{
    timestamp: string
    change: string
    reason: string
  }>
}

type ReviewSummary = {
  category: ReviewCategory
  categoryDisplayName: string
  useCases?: UseCaseExecution[]
  summary: string
  score?: number // 10点満点のスコア（Use Cases以外）
  maxScore?: number // 最大スコア（通常10）
  passedCount?: number // Use Cases用
  failedCount?: number // Use Cases用
  partialCount?: number // Use Cases用
}

type TabInfo = {
  id: string
  title: string
  type: 'overview' | 'detail' | 'test-detail' | 'usecase-detail'
  category?: ReviewCategory
  testId?: string
  useCaseId?: string
}

// モックデータ
const mockTestCases: TestCase[] = [
  {
    id: 'TC-001',
    name: 'ユーザー登録テスト',
    category: 'USE_CASES',
    status: 'PASSED',
    duration: '2.1s',
    description: 'ユーザーが正常に登録できることを確認',
    details:
      'ユーザー登録APIの正常系テスト。必要な情報を入力してユーザーが作成されることを確認する。データベースに正しく保存され、適切なレスポンスが返されることをテストします。',
    sqlQuery:
      "INSERT INTO users (email, password_hash, created_at) VALUES ('test@example.com', 'hashed_password', NOW()) RETURNING id;",
    expectedResult: 'ユーザーID が返される',
    actualResult: 'ユーザーID: 123 が返された',
  },
  {
    id: 'TC-002',
    name: 'ユーザーログインテスト',
    category: 'USE_CASES',
    status: 'PASSED',
    duration: '1.8s',
    description: '正しい認証情報でログインできることを確認',
    details:
      'ユーザーログイン機能の正常系テスト。正しいメールアドレスとパスワードでログインできることを確認する。',
    sqlQuery:
      "SELECT id, email FROM users WHERE email = 'test@example.com' AND password_hash = 'hashed_password';",
    expectedResult: 'ユーザー情報が返される',
    actualResult: 'ユーザー情報が正常に返された',
  },
  {
    id: 'TC-003',
    name: 'メッセージ投稿テスト',
    category: 'USE_CASES',
    status: 'PASSED',
    duration: '1.5s',
    description: 'チャンネルにメッセージを投稿できることを確認',
    details:
      'メッセージ投稿機能のテスト。ユーザーがチャンネルにメッセージを投稿できることを確認する。',
    sqlQuery:
      "INSERT INTO messages (channel_id, user_id, content, created_at) VALUES (1, 123, 'Hello World!', NOW()) RETURNING id;",
    expectedResult: 'メッセージIDが返される',
    actualResult: 'メッセージID: 456 が返された',
  },
  {
    id: 'TC-004',
    name: 'インデックス効果テスト',
    category: 'PERFORMANCE',
    status: 'PASSED',
    duration: '0.8s',
    description: 'メッセージ検索のインデックス効果を確認',
    details:
      'messages テーブルのインデックスがクエリパフォーマンスに与える効果を測定。インデックスが正しく使用されていることを確認する。',
    sqlQuery:
      'EXPLAIN ANALYZE SELECT * FROM messages WHERE channel_id = 1 ORDER BY created_at DESC LIMIT 20;',
    expectedResult: 'インデックススキャンが使用される',
    actualResult:
      'Query Execution Plan:\n\nLimit (fetch 20 rows)\n├─ Sort (created_at DESC)\n│  └─ Method: top-N heapsort\n│  └─ Memory Usage: 25kB\n└─ Index Scan\n   ├─ Index: messages_channel_id_idx\n   ├─ Condition: channel_id = 1\n   └─ Rows Processed: 4,000\n\nExecution Time\n├─ Planning Time: 0.095 ms\n└─ Execution Time: 5.250 ms\n\nPerformance Details\n├─ Index Scan Time: 4.987 ms\n├─ Sort Time: 5.190 ms\n├─ Buffer Hits: 500\n└─ Disk Reads: 100\n\nResult: Index effectively used, performance good',
    adjustmentHistory: [
      {
        timestamp: '2025/06/03 12:45 JST',
        change:
          'messages テーブルに channel_id + created_at の複合インデックスを追加。',
        reason:
          '理由: 初期テストでSeq Scanが発生し、パフォーマンス要件を満たさなかったため。',
      },
      {
        timestamp: '2025/06/03 13:20 JST',
        change: 'PostgreSQLのwork_memを128MBに調整。',
        reason:
          '理由: ソート処理がディスクに溢れ、パフォーマンスが劣化していたため。',
      },
    ],
  },
  {
    id: 'TC-005',
    name: 'アクセス権限テスト',
    category: 'SECURITY',
    status: 'PASSED',
    duration: '1.2s',
    description: '不正なアクセスが拒否されることを確認',
    details:
      'プライベートチャンネルへの不正アクセスが適切に拒否されることを確認。権限のないユーザーがアクセスできないことをテストする。',
    sqlQuery:
      'SELECT * FROM channel_memberships WHERE channel_id = 2 AND user_id = 999;',
    expectedResult: '結果が0件',
    actualResult: '0 rows returned - アクセス拒否が正常に動作',
    adjustmentHistory: [
      {
        timestamp: '2025/06/03 11:30 JST',
        change:
          'channel_membershipsテーブルにRLS (Row Level Security) ポリシーを追加。',
        reason:
          '理由: 初期テストで権限チェックが不十分で、他ユーザーのメンバーシップ情報が見えてしまったため。',
      },
      {
        timestamp: '2025/06/03 11:45 JST',
        change:
          'usersテーブルにrole列を追加し、admin/memberの権限レベルを実装。',
        reason:
          '理由: 管理者権限でのアクセス制御テストが失敗し、ロールベースアクセス制御が必要になったため。',
      },
    ],
  },
  {
    id: 'TC-006',
    name: 'データ整合性テスト',
    category: 'DATA_INTEGRITY',
    status: 'PASSED',
    duration: '0.5s',
    description: '外部キー制約が正しく動作することを確認',
    details:
      '存在しないユーザーIDでメッセージを作成しようとした際に外部キー制約エラーが発生することを確認。',
    sqlQuery:
      "INSERT INTO messages (channel_id, user_id, content) VALUES (1, 99999, 'Test message');",
    expectedResult: '外部キー制約エラー',
    actualResult:
      'ERROR: insert or update on table "messages" violates foreign key constraint',
    adjustmentHistory: [
      {
        timestamp: '2025/06/03 10:15 JST',
        change: 'messagesテーブルのuser_idに外部キー制約を追加。',
        reason:
          '理由: 初期テストで存在しないユーザーIDでのメッセージ作成が成功してしまい、データ整合性が保たれなかったため。',
      },
      {
        timestamp: '2025/06/03 10:30 JST',
        change:
          'channel_idにも外部キー制約を追加し、存在しないチャンネルへの投稿を防止。',
        reason:
          '理由: 「存在しないチャンネルへのメッセージ投稿」テストが失敗し、参照整合性の完全性を確保するため。',
      },
    ],
  },
]

const mockReviewData: ReviewSummary[] = [
  {
    category: 'USE_CASES',
    categoryDisplayName: 'Use Cases',
    summary: 'ユースケース実行結果の検証',
    passedCount: 2,
    failedCount: 0,
    partialCount: 0,
    useCases: [
      {
        id: 'UC-01',
        title: 'ユーザー登録とログイン',
        status: 'PASSED',
        testResult: '成功',
        brdRequirements: [
          {
            id: 'BRD-001',
            description: 'ユーザーはユニークなIDで登録できる',
          },
          {
            id: 'BRD-005',
            description: 'パスワードはセキュアに保存される',
          },
        ],
        relatedDb: ['users.id', 'users.email', 'users.password_hash'],
        adjustmentHistory: [
          {
            timestamp: '2025/06/03 13:05 JST',
            change: 'usersテーブルにUNIQUE制約 (emailカラム) を追加。',
            reason:
              '理由: 「重複メールアドレスでのユーザー登録」テストが失敗したため。',
          },
          {
            timestamp: '2025/06/03 13:10 JST',
            change:
              'users.passwordカラムをhashed_passwordに変更し、デフォルトでハッシュ化関数が適用されるDBトリガーを追加。',
            reason:
              '理由: 「パスワードのハッシュ保存」テストが失敗し、セキュリティ要件(BRD-005)を満たすため。',
          },
        ],
        testDetails: [
          {
            step: 1,
            title: 'ユーザー登録テスト',
            description: 'test@example.comでユーザーを登録',
            sqlQuery:
              "INSERT INTO users (email, password_hash, created_at) VALUES ('test@example.com', 'hashed_password', NOW()) RETURNING id;",
            expectedResult: 'ユーザーIDが返される',
            actualResult: 'ユーザーID: 123 が返された',
          },
          {
            step: 2,
            title: 'ユーザー登録の検証',
            description: 'ユーザーが正しく作成されたことを確認',
            sqlQuery:
              "SELECT COUNT(*) FROM users WHERE email = 'test@example.com';",
            expectedResult: '結果が1',
            actualResult: '1',
          },
          {
            step: 3,
            title: 'ログインテスト',
            description: '登録したユーザーでログイン',
            sqlQuery:
              "SELECT id, email FROM users WHERE email = 'test@example.com' AND password_hash = 'hashed_password';",
            expectedResult: 'ユーザー情報が返される',
            actualResult: 'ユーザー情報が正常に返された',
            tableResult: {
              columns: ['id', 'email'],
              rows: [{ id: 123, email: 'test@example.com' }],
            },
          },
          {
            step: 4,
            title: 'クリーンアップ',
            description: 'テストデータの削除',
            sqlQuery: "DELETE FROM users WHERE email = 'test@example.com';",
            expectedResult: '1行削除される',
            actualResult: '1行削除された',
          },
        ],
      },
      {
        id: 'UC-02',
        title: 'ユーザー削除',
        status: 'PASSED',
        testResult: '成功',
        brdRequirements: [
          {
            id: 'BRD-010',
            description:
              'ユーザー削除時に関連データ（コメント、投稿）も削除される',
          },
        ],
        relatedDb: ['users.id', 'comments.user_id', 'posts.user_id'],
        adjustmentHistory: [
          {
            timestamp: '2025/06/03 13:30 JST',
            change:
              'comments.user_idとposts.user_idにON DELETE CASCADEオプション付きの外部キー制約を追加。',
            reason:
              '理由: 「ユーザー削除時に紐づくコメントが残る」テストが失敗したため（このユースケースで最も多くの調整が発生）。',
          },
        ],
        testDetails: [
          {
            step: 1,
            title: 'テストユーザーとデータの準備',
            description: 'ユーザーとそれに関連するコメント・投稿を作成',
            sqlQuery:
              "INSERT INTO users (id, email) VALUES (999, 'delete_test@example.com'); INSERT INTO comments (user_id, content) VALUES (999, 'テストコメント'); INSERT INTO posts (user_id, title) VALUES (999, 'テスト投稿');",
            expectedResult: 'ユーザーとその関連データが作成される',
            actualResult: 'ユーザーID: 999 と関連データが作成された',
          },
          {
            step: 2,
            title: 'ユーザー削除前の確認',
            description: 'ユーザーに関連するデータの存在確認',
            sqlQuery:
              'SELECT COUNT(*) as comment_count FROM comments WHERE user_id = 999; SELECT COUNT(*) as post_count FROM posts WHERE user_id = 999;',
            expectedResult: 'コメント数: 1, 投稿数: 1',
            actualResult: 'コメント数: 1, 投稿数: 1',
          },
          {
            step: 3,
            title: 'ユーザー削除実行',
            description: 'CASCADE削除によってユーザーと関連データを一括削除',
            sqlQuery: 'DELETE FROM users WHERE id = 999;',
            expectedResult: 'ユーザーと関連データが削除される',
            actualResult: '1行削除された（CASCADE により関連データも削除）',
          },
          {
            step: 4,
            title: '削除後の検証',
            description: 'ユーザーと関連データが削除されたことを確認',
            sqlQuery:
              'SELECT COUNT(*) as comment_count FROM comments WHERE user_id = 999; SELECT COUNT(*) as post_count FROM posts WHERE user_id = 999;',
            expectedResult: 'コメント数: 0, 投稿数: 0',
            actualResult: 'コメント数: 0, 投稿数: 0（CASCADE削除成功）',
          },
        ],
      },
    ],
  },
  {
    category: 'PERFORMANCE',
    categoryDisplayName: 'Performance',
    summary: 'パフォーマンス観点での検証結果',
    score: 8,
    maxScore: 10,
  },
  {
    category: 'SECURITY',
    categoryDisplayName: 'Security',
    summary: 'セキュリティ観点での検証結果',
    score: 9,
    maxScore: 10,
  },
  {
    category: 'MIGRATION_SAFETY',
    categoryDisplayName: 'Migration Safety',
    summary: 'マイグレーション安全性の検証結果',
    score: 6,
    maxScore: 10,
  },
  {
    category: 'DATA_INTEGRITY',
    categoryDisplayName: 'Data Integrity',
    summary: 'データ整合性の検証結果',
    score: 10,
    maxScore: 10,
  },
]

export const QAContent: FC = () => {
  const [tabs, setTabs] = useState<TabInfo[]>([
    { id: 'overview', title: 'Overview', type: 'overview' },
  ])
  const [activeTab, setActiveTab] = useState('overview')

  const handleCloseTab = (tabId: string) => {
    if (tabId === 'overview') return

    const newTabs = tabs.filter((tab) => tab.id !== tabId)
    setTabs(newTabs)

    if (activeTab === tabId) {
      setActiveTab('overview')
    }
  }

  const handleCategoryClick = (
    category: ReviewCategory,
    displayName: string,
  ) => {
    const tabId = `detail-${category}`
    const existingTab = tabs.find((tab) => tab.id === tabId)

    if (!existingTab) {
      const newTab: TabInfo = {
        id: tabId,
        title: displayName,
        type: 'detail',
        category: category,
      }
      setTabs([...tabs, newTab])
    }
    setActiveTab(tabId)
  }

  const handleTestClick = (testCase: TestCase) => {
    const tabId = `test-${testCase.id}`
    const existingTab = tabs.find((tab) => tab.id === tabId)

    if (!existingTab) {
      const newTab: TabInfo = {
        id: tabId,
        title: testCase.name,
        type: 'test-detail',
        testId: testCase.id,
      }
      setTabs([...tabs, newTab])
    }
    setActiveTab(tabId)
  }

  const handleUseCaseClick = (useCase: UseCaseExecution) => {
    const tabId = `usecase-${useCase.id}`
    const existingTab = tabs.find((tab) => tab.id === tabId)

    if (!existingTab) {
      const newTab: TabInfo = {
        id: tabId,
        title: useCase.title,
        type: 'usecase-detail',
        useCaseId: useCase.id,
      }
      setTabs([...tabs, newTab])
    }
    setActiveTab(tabId)
  }

  const selectedCategory = activeTab.startsWith('detail-')
    ? mockReviewData.find(
        (summary) => `detail-${summary.category}` === activeTab,
      )
    : null

  const selectedTest = activeTab.startsWith('test-')
    ? mockTestCases.find((test) => `test-${test.id}` === activeTab)
    : null

  const useCasesData = mockReviewData.find(
    (data) => data.category === 'USE_CASES',
  )

  const selectedUseCase = activeTab.startsWith('usecase-')
    ? useCasesData?.useCases?.find(
        (useCase) => `usecase-${useCase.id}` === activeTab,
      )
    : null

  const getTestStatusColor = (
    status: 'PASSED' | 'FAILED' | 'RUNNING' | 'PENDING',
  ): string => {
    switch (status) {
      case 'PASSED':
        return styles.statusPassed
      case 'FAILED':
        return styles.statusFailed
      case 'RUNNING':
        return styles.statusPartial
      case 'PENDING':
        return styles.statusPartial
      default:
        return ''
    }
  }

  const getTotalCount = (summary: ReviewSummary): number => {
    if (summary.useCases) {
      return (
        (summary.passedCount || 0) +
        (summary.failedCount || 0) +
        (summary.partialCount || 0)
      )
    }
    return summary.maxScore || 10
  }

  return (
    <TabsRoot
      value={activeTab}
      onValueChange={setActiveTab}
      className={styles.wrapper}
    >
      <div className={styles.header}>
        <div className={styles.title}>QA</div>
        <TabsList className={styles.tabsList}>
          {tabs.map((tab) => (
            <div key={tab.id} className={styles.tabContainer}>
              <TabsTrigger value={tab.id} className={styles.tabsTrigger}>
                {tab.title}
              </TabsTrigger>
              {tab.type !== 'overview' && (
                <button
                  type="button"
                  className={styles.closeButton}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCloseTab(tab.id)
                  }}
                  aria-label={`Close ${tab.title} tab`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </TabsList>
      </div>

      <TabsContent value="overview" className={styles.overviewSection}>
        <div className={styles.reportContainer}>
          {/* ユースケース一覧 */}
          <section className={styles.testsOverviewSection}>
            <h2 className={styles.reportSectionTitle}>ユースケース一覧</h2>
            <div className={styles.testsOverviewHeader}>
              <div className={styles.testsStats}>
                <span className={styles.totalTests}>
                  {useCasesData?.useCases?.length || 0} use cases
                </span>
                <span className={styles.passedTests}>
                  {useCasesData?.useCases?.filter(
                    (useCase) => useCase.status === 'PASSED',
                  ).length || 0}{' '}
                  passed
                </span>
              </div>
            </div>
            <div className={styles.testsOverviewList}>
              {useCasesData?.useCases?.map((useCase) => {
                const statusClass =
                  useCase.status === 'PASSED'
                    ? styles.statusPassed
                    : useCase.status === 'FAILED'
                      ? styles.statusFailed
                      : styles.statusPartial

                return (
                  <button
                    key={useCase.id}
                    type="button"
                    className={styles.testOverviewItem}
                    onClick={() => handleUseCaseClick(useCase)}
                    aria-label={`View details for ${useCase.title}`}
                  >
                    <div className={styles.testOverviewHeader}>
                      <div className={styles.testId}>{useCase.id}</div>
                      <div className={styles.testName}>{useCase.title}</div>
                      <div className={styles.testCategory}>USE_CASES</div>
                      <div className={`${styles.testStatus} ${statusClass}`}>
                        {useCase.status}
                      </div>
                    </div>
                    <div className={styles.testDescription}>
                      テスト結果: {useCase.testResult} | BRD要件:{' '}
                      {useCase.brdRequirements.length}件 | 調整履歴:{' '}
                      {useCase.adjustmentHistory.length}回
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* 非機能要件サマリー */}
          <section className={styles.evaluationSummary}>
            <h2 className={styles.reportSectionTitle}>非機能要件サマリー</h2>
            <div className={styles.summaryHeader}>
              <h3>
                総合評価: <span className={styles.overallGrade}>良好</span>
              </h3>
            </div>
            <div className={styles.evaluationGrid}>
              <div className={`${styles.evaluationCard} ${styles.good}`}>
                <h4>安全性</h4>
                <div className={styles.evaluationIcon}>✔ 良好</div>
                <div className={styles.evaluationDetails}>
                  <p>
                    <strong>Security:</strong> 現状パスワードカラムはなく、OAuth
                    連携等で外部認証を想定しているため平文パスワード保存リスクなし。
                  </p>
                  <p>
                    <strong>RBAC</strong>{' '}
                    を拡張する場合、channel_memberships.role 以外に{' '}
                    <strong>行レベルセキュリティ (RLS)</strong>{' '}
                    を導入し、プライベートチャンネルを DB
                    レイヤで強制する設計も視野に。
                  </p>
                  <p>
                    <strong>Scalability:</strong> 全テーブルとも BIGINT 主キーで
                    2^63-1 件まで対応。将来的に 1 テーブル 10^9
                    行級となる場合は、
                  </p>
                  <p>
                    1) <strong>Auto-VACUUM / REINDEX ポリシー</strong> の調整
                    <br />
                    2){' '}
                    <strong>論理レプリケーション + リードレプリカ分散</strong>
                    <br />
                    3) messages のパーティション or ショーディング
                    <br />
                    を計画段階でロードマップ化しておくと安心。
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.detailsLink}
                  onClick={() => handleCategoryClick('SECURITY', 'Security')}
                >
                  詳細を見る
                </button>
              </div>
              <div className={`${styles.evaluationCard} ${styles.warning}`}>
                <h4>マイグレーション安全</h4>
                <div className={styles.evaluationIcon}>▲ 要確認</div>
                <div className={styles.evaluationDetails}>
                  <p>
                    DDL はすべて <strong>CREATE TABLE</strong>{' '}
                    で破壊的操作は含まず安全性は高め。
                  </p>
                  <p>
                    ただし <strong>トランザクション境界の宣言</strong>{' '}
                    がないため、大量データの後続マイグレーション（カラム追加＋データ移行など）を含める場合は{' '}
                    <strong>BEGIN … COMMIT;</strong> でラップし、ツール (Sqitch,
                    Rails migrations, golang-migrate 等) の{' '}
                    <strong>fail-fast & auto-rollback</strong>{' '}
                    機構を必ず使うことを推奨。
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.detailsLink}
                  onClick={() =>
                    handleCategoryClick('MIGRATION_SAFETY', 'Migration Safety')
                  }
                >
                  詳細を見る
                </button>
              </div>
              <div className={`${styles.evaluationCard} ${styles.warning}`}>
                <h4>パフォーマンス</h4>
                <div className={styles.evaluationIcon}>▲ 最適化の余地</div>
                <div className={styles.evaluationDetails}>
                  <p>
                    読み取り系は主要 FK &
                    検索キーにインデックスを付与しておりベースラインとしては良好。
                  </p>
                  <p>
                    <strong>messages テーブルの肥大化</strong>{' '}
                    がボトルネックになりやすい。メンテ予定があるなら PARTITION
                    BY HASH (channel_id) など水平パーティションを検討。
                  </p>
                  <p>
                    message_reactions の高頻度書き込みは{' '}
                    <strong>UNIQUE (message_id, user_id, emoji)</strong>{' '}
                    が競合になり得るため、同一キーに対して "INSERT … ON
                    CONFLICT" を利用し <strong>UPSERT</strong> 設計を確認。
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.detailsLink}
                  onClick={() =>
                    handleCategoryClick('PERFORMANCE', 'Performance')
                  }
                >
                  詳細を見る
                </button>
              </div>
              <div className={`${styles.evaluationCard} ${styles.good}`}>
                <h4>データ整合性</h4>
                <div className={styles.evaluationIcon}>✔ 強力</div>
                <div className={styles.evaluationDetails}>
                  <p>
                    すべての FK に <strong>参照整合性制約</strong>{' '}
                    を設定、UNIQUE (channel_id, user_id) など重複防止も OK。
                  </p>
                  <p>ソフトデリート採用で履歴保持の要件を満たす。</p>
                  <p>
                    今後のリリースで{' '}
                    <strong>NOT NULL {'->'} NULLABLE 変更</strong>{' '}
                    が発生する場合は ① バックフィル ② 制約緩和 の 2
                    ステップに分割する "expand-migrate-contract" 戦略が安全。
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.detailsLink}
                  onClick={() =>
                    handleCategoryClick('DATA_INTEGRITY', 'Data Integrity')
                  }
                >
                  詳細を見る
                </button>
              </div>
            </div>

            <div style={{ marginTop: 'var(--spacing-6)' }}>
              <h3 className={styles.reportSectionTitle}>テスト詳細</h3>
              <div className={styles.testsOverviewHeader}>
                <div className={styles.testsStats}>
                  <span className={styles.totalTests}>
                    {
                      mockTestCases.filter(
                        (test) => test.category !== 'USE_CASES',
                      ).length
                    }{' '}
                    tests
                  </span>
                  <span className={styles.passedTests}>
                    {
                      mockTestCases.filter(
                        (test) =>
                          test.category !== 'USE_CASES' &&
                          test.status === 'PASSED',
                      ).length
                    }{' '}
                    passed
                  </span>
                </div>
              </div>
              <div className={styles.testsOverviewList}>
                {mockTestCases
                  .filter((testCase) => testCase.category !== 'USE_CASES')
                  .map((testCase) => (
                    <button
                      key={testCase.id}
                      type="button"
                      className={styles.testOverviewItem}
                      onClick={() => handleTestClick(testCase)}
                      aria-label={`View details for ${testCase.name}`}
                    >
                      <div className={styles.testOverviewHeader}>
                        <div className={styles.testId}>{testCase.id}</div>
                        <div className={styles.testName}>{testCase.name}</div>
                        <div className={styles.testCategory}>
                          {testCase.category}
                        </div>
                        <div
                          className={`${styles.testStatus} ${getTestStatusColor(testCase.status)}`}
                        >
                          {testCase.status}
                        </div>
                        {testCase.duration && (
                          <div className={styles.testDuration}>
                            {testCase.duration}
                          </div>
                        )}
                      </div>
                      <div className={styles.testDescription}>
                        {testCase.description}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </section>
        </div>
      </TabsContent>

      {/* テストケース詳細タブ */}
      {selectedTest && (
        <TabsContent
          value={`test-${selectedTest.id}`}
          className={styles.testDetailSection}
        >
          <div className={styles.testDetailContainer}>
            <div className={styles.testDetailHeader}>
              <h2 className={styles.testDetailTitle}>{selectedTest.name}</h2>
              <div
                className={`${styles.testDetailStatus} ${getTestStatusColor(selectedTest.status)}`}
              >
                {selectedTest.status}
              </div>
            </div>

            <div className={styles.testDetailBody}>
              <div className={styles.testDetailSection}>
                <h3 className={styles.testDetailSectionTitle}>概要</h3>
                <p className={styles.testDetailDescription}>
                  {selectedTest.description}
                </p>
              </div>

              <div className={styles.testDetailSection}>
                <h3 className={styles.testDetailSectionTitle}>詳細</h3>
                <p className={styles.testDetailDetails}>
                  {selectedTest.details}
                </p>
              </div>

              {selectedTest.sqlQuery && (
                <div className={styles.testDetailSection}>
                  <h3 className={styles.testDetailSectionTitle}>SQL Query</h3>
                  <div className={styles.testSqlQuery}>
                    {selectedTest.sqlQuery}
                  </div>
                </div>
              )}

              <div className={styles.testDetailSection}>
                <h3 className={styles.testDetailSectionTitle}>期待結果</h3>
                <p className={styles.testExpectedResult}>
                  {selectedTest.expectedResult}
                </p>
              </div>

              <div className={styles.testDetailSection}>
                <h3 className={styles.testDetailSectionTitle}>実際の結果</h3>
                <p className={styles.testActualResult}>
                  {selectedTest.actualResult}
                </p>
              </div>

              {selectedTest.errorMessage && (
                <div className={styles.testDetailSection}>
                  <h3 className={styles.testDetailSectionTitle}>
                    エラーメッセージ
                  </h3>
                  <p className={styles.testErrorMessage}>
                    {selectedTest.errorMessage}
                  </p>
                </div>
              )}

              {selectedTest.adjustmentHistory &&
                selectedTest.adjustmentHistory.length > 0 && (
                  <div className={styles.testDetailSection}>
                    <h3 className={styles.testDetailSectionTitle}>
                      AIによる調整履歴
                    </h3>
                    <ul className={styles.adjustmentHistoryList}>
                      {selectedTest.adjustmentHistory.map(
                        (adjustment, index) => (
                          <li
                            key={`${selectedTest.id}-adjustment-${index}`}
                            className={styles.adjustmentHistoryItem}
                          >
                            <strong>{adjustment.timestamp}:</strong>{' '}
                            {adjustment.change}
                            <br />
                            <em>{adjustment.reason}</em>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
            </div>
          </div>
        </TabsContent>
      )}

      {/* ユースケース詳細タブ */}
      {selectedUseCase && (
        <TabsContent
          value={`usecase-${selectedUseCase.id}`}
          className={styles.testDetailSection}
        >
          <div className={styles.testDetailContainer}>
            <div className={styles.testDetailHeader}>
              <h2 className={styles.testDetailTitle}>
                {selectedUseCase.title}
              </h2>
              <div
                className={`${styles.testDetailStatus} ${selectedUseCase.status === 'PASSED' ? styles.statusPassed : styles.statusFailed}`}
              >
                {selectedUseCase.status}
              </div>
            </div>

            <div className={styles.testDetailBody}>
              <div className={styles.testDetailSection}>
                <h3 className={styles.testDetailSectionTitle}>テスト結果</h3>
                <p className={styles.testDetailDescription}>
                  {selectedUseCase.testResult}
                </p>
              </div>

              <div className={styles.testDetailSection}>
                <h3 className={styles.testDetailSectionTitle}>BRD要件</h3>
                <ul className={styles.brdRequirementsList}>
                  {selectedUseCase.brdRequirements.map((req) => (
                    <li key={req.id} className={styles.brdRequirementItem}>
                      <strong>{req.id}:</strong> {req.description}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.testDetailSection}>
                <h3 className={styles.testDetailSectionTitle}>関連DB</h3>
                <p className={styles.testDetailDescription}>
                  {selectedUseCase.relatedDb.map((db, index) => (
                    <span key={db}>
                      <code className={styles.dbCode}>{db}</code>
                      {index < selectedUseCase.relatedDb.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </p>
              </div>

              <div className={styles.testDetailSection}>
                <h3 className={styles.testDetailSectionTitle}>
                  実行したテスト内容
                </h3>
                {selectedUseCase.testDetails?.map((testDetail) => (
                  <div
                    key={testDetail.step}
                    className={styles.useCaseDetailCard}
                  >
                    <h4 className={styles.testDetailSectionTitle}>
                      {testDetail.step}. {testDetail.title}
                    </h4>
                    <p className={styles.testDetailDescription}>
                      {testDetail.description}
                    </p>
                    <div className={styles.testDetailSection}>
                      <h5 className={styles.adjustmentHistoryTitle}>
                        SQL Query:
                      </h5>
                      <div className={styles.testSqlQuery}>
                        {testDetail.sqlQuery}
                      </div>
                    </div>
                    <div className={styles.testDetailSection}>
                      <h5 className={styles.adjustmentHistoryTitle}>
                        期待結果:
                      </h5>
                      <p className={styles.testExpectedResult}>
                        {testDetail.expectedResult}
                      </p>
                    </div>
                    {testDetail.actualResult && (
                      <div className={styles.testDetailSection}>
                        <h5 className={styles.adjustmentHistoryTitle}>
                          実際の結果:
                        </h5>
                        {testDetail.tableResult ? (
                          <div className={styles.tableContainer}>
                            <table className={styles.resultTable}>
                              <thead>
                                <tr>
                                  {testDetail.tableResult.columns.map(
                                    (column) => (
                                      <th
                                        key={column}
                                        className={styles.tableHeader}
                                      >
                                        {column}
                                      </th>
                                    ),
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {testDetail.tableResult.rows.map(
                                  (row, index) => (
                                    <tr
                                      key={`row-${testDetail.step}-${index}`}
                                      className={styles.tableRow}
                                    >
                                      {testDetail.tableResult?.columns.map(
                                        (column) => (
                                          <td
                                            key={column}
                                            className={styles.tableCell}
                                          >
                                            {row[column]}
                                          </td>
                                        ),
                                      )}
                                    </tr>
                                  ),
                                )}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className={styles.testActualResult}>
                            {testDetail.actualResult}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className={styles.testDetailSection}>
                <h3 className={styles.testDetailSectionTitle}>
                  AIによる調整履歴
                </h3>
                <ul className={styles.adjustmentHistoryList}>
                  {selectedUseCase.adjustmentHistory.map(
                    (adjustment, index) => (
                      <li
                        key={`${selectedUseCase.id}-adjustment-${index}`}
                        className={styles.adjustmentHistoryItem}
                      >
                        <strong>{adjustment.timestamp}:</strong>{' '}
                        {adjustment.change}
                        <br />
                        <em>{adjustment.reason}</em>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>
      )}

      {/* カテゴリ詳細タブ */}
      {selectedCategory && (
        <TabsContent
          value={`detail-${selectedCategory.category}`}
          className={styles.detailSection}
        >
          <div className={styles.categoryHeader}>
            <h2 className={styles.categoryTitle}>
              {selectedCategory.categoryDisplayName}
            </h2>
            <div className={styles.categoryStats}>
              <span className={styles.totalCount}>
                {getTotalCount(selectedCategory)} total
              </span>
            </div>
          </div>

          {selectedCategory.category === 'USE_CASES' &&
          selectedCategory.useCases ? (
            <div className={styles.useCasesList}>
              <div className={styles.sectionTitle}>ユースケース別詳細</div>
              {selectedCategory.useCases.map((useCase) => (
                <div key={useCase.id} className={styles.useCaseDetailCard}>
                  <div className={styles.useCaseDetailHeader}>
                    <h3 className={styles.useCaseDetailTitle}>
                      ユースケース名: {useCase.title}{' '}
                      <span className={styles.useCaseStatusIcon}>
                        {useCase.status === 'PASSED' ? '✔' : '✗'}
                      </span>
                    </h3>
                  </div>

                  <div className={styles.useCaseDetailContent}>
                    <div className={styles.useCaseDetailSection}>
                      <p>
                        <strong>テスト結果:</strong> {useCase.testResult}
                      </p>
                    </div>

                    <div className={styles.useCaseDetailSection}>
                      <p>
                        <strong>BRD要件:</strong>
                      </p>
                      <ul className={styles.brdRequirementsList}>
                        {useCase.brdRequirements.map((req) => (
                          <li
                            key={req.id}
                            className={styles.brdRequirementItem}
                          >
                            <strong>{req.id}:</strong> {req.description}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className={styles.useCaseDetailSection}>
                      <p>
                        <strong>関連DB:</strong>{' '}
                        {useCase.relatedDb.map((db, index) => (
                          <span key={db}>
                            <code className={styles.dbCode}>{db}</code>
                            {index < useCase.relatedDb.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </p>
                    </div>

                    <div className={styles.useCaseDetailSection}>
                      <h4 className={styles.adjustmentHistoryTitle}>
                        AIによる調整履歴:
                      </h4>
                      <ul className={styles.adjustmentHistoryList}>
                        {useCase.adjustmentHistory.map((adjustment, index) => (
                          <li
                            key={`${useCase.id}-adjustment-${index}`}
                            className={styles.adjustmentHistoryItem}
                          >
                            <strong>{adjustment.timestamp}:</strong>{' '}
                            {adjustment.change}
                            <br />
                            <em>{adjustment.reason}</em>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.summaryOnly}>
              <div className={styles.summaryText}>
                {selectedCategory.summary}
              </div>
              {selectedCategory.score !== undefined ? (
                <div className={styles.scoreDisplay}>
                  <div className={styles.scoreLabel}>総合スコア</div>
                  <div className={styles.scoreValue}>
                    <span className={styles.currentScore}>
                      {selectedCategory.score}
                    </span>
                    <span className={styles.maxScore}>
                      / {selectedCategory.maxScore}
                    </span>
                  </div>
                  <div className={styles.scorePercentage}>
                    {Math.round(
                      (selectedCategory.score /
                        (selectedCategory.maxScore || 10)) *
                        100,
                    )}
                    %
                  </div>
                </div>
              ) : (
                <div className={styles.statusSummary}>
                  <div
                    className={`${styles.statusItem} ${styles.statusPassed}`}
                  >
                    Passed: {selectedCategory.passedCount}
                  </div>
                  <div
                    className={`${styles.statusItem} ${styles.statusFailed}`}
                  >
                    Failed: {selectedCategory.failedCount}
                  </div>
                  <div
                    className={`${styles.statusItem} ${styles.statusPartial}`}
                  >
                    Partial: {selectedCategory.partialCount}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      )}
    </TabsRoot>
  )
}
