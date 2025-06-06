import { ERDRenderer } from '@/features'
import { VersionProvider } from '@/providers'
import { versionSchema } from '@/schemas'
import { initSchemaStore } from '@/stores'
import type { Schema } from '@liam-hq/db-structure'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '@liam-hq/ui'
import { type FC, useEffect, useState } from 'react'
import { parse } from 'valibot'
import { MigrationsViewer } from '../MigrationsViewer'
import { AFTER } from '../after'
import { BEFORE } from '../before'
import { ddl } from '../constants'
import styles from './BRD.module.css'

export type ErrorObject = {
  name: string
  message: string
  instruction?: string
}

type SqlBlock = {
  title: string
  code: string
  executable?: boolean
}

type ExecutionResult = {
  status: 'success' | 'error' | 'loading'
  data?: Array<Record<string, string | number | null>>
  explainData?: Array<Record<string, string | number | null>>
  message?: string
  rowsAffected?: number
}

type UseCase = {
  id: string
  title: string
  steps?: string[]
  sqlBlocks?: SqlBlock[]
  additionalSteps?: string[]
  bullets?: string[]
}

type BusinessRequirement = {
  id: string
  title: string
  overview: string[]
  useCases: UseCase[]
}

interface HighlighterStyles {
  theme: Record<string, unknown>
  customStyle: Record<string, unknown>
  codeTagProps: Record<string, unknown>
}

const syntaxCustomStyle = {
  borderRadius: 0,
  marginBottom: 0,
}

const SqlHighlighter: FC<{ code: string }> = ({ code }) => {
  const [HighlighterComponent, setHighlighterComponent] = useState<FC<
    Record<string, unknown>
  > | null>(null)
  const [highlighterStyles, setHighlighterStyles] =
    useState<HighlighterStyles | null>(null)

  useEffect(() => {
    const loadHighlighter = async () => {
      try {
        const [highlighterModule, stylesModule] = await Promise.all([
          import('react-syntax-highlighter'),
          import('@liam-hq/ui'),
        ])

        setHighlighterComponent(
          () =>
            highlighterModule.Prism as unknown as FC<Record<string, unknown>>,
        )
        setHighlighterStyles({
          theme: stylesModule.syntaxTheme as Record<string, unknown>,
          customStyle: {
            ...(stylesModule.syntaxCustomStyle as Record<string, unknown>),
            ...(syntaxCustomStyle as Record<string, unknown>),
          },
          codeTagProps: stylesModule.syntaxCodeTagProps as Record<
            string,
            unknown
          >,
        })
      } catch (error) {
        console.error('Failed to load syntax highlighter:', error)
      }
    }
    loadHighlighter()
  }, [])

  if (!HighlighterComponent || !highlighterStyles) {
    return (
      <div className={styles.codeContent}>
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    )
  }

  return (
    <div className={styles.codeContent}>
      <HighlighterComponent
        language="sql"
        style={highlighterStyles.theme}
        customStyle={highlighterStyles.customStyle}
        codeTagProps={highlighterStyles.codeTagProps}
        showLineNumbers={false}
        wrapLines={true}
        lineProps={{
          style: { wordBreak: 'break-all', whiteSpace: 'pre-wrap' },
        }}
      >
        {code}
      </HighlighterComponent>
    </div>
  )
}

const ExecutableCodeBlock: FC<{
  sqlBlock: SqlBlock
}> = ({ sqlBlock }) => {
  const [result, setResult] = useState<ExecutionResult | null>(null)

  const handleExecute = async () => {
    setResult({ status: 'loading' })

    // モックデータで実行結果をシミュレート
    setTimeout(() => {
      if (sqlBlock.code.toLowerCase().includes('select')) {
        // SELECT文のモック結果
        if (sqlBlock.code.includes('user_id FROM users WHERE email')) {
          setResult({
            status: 'success',
            data: [{ user_id: '123' }],
            explainData: [
              {
                id: 1,
                select_type: 'SIMPLE',
                table: 'users',
                type: 'ref',
                possible_keys: 'idx_email',
                key: 'idx_email',
                key_len: '255',
                ref: 'const',
                rows: 1,
                Extra: 'Using index',
              },
            ],
            message: '1 row returned',
          })
        } else if (sqlBlock.code.includes('SELECT\n  user_id')) {
          setResult({
            status: 'success',
            data: [
              {
                user_id: '123',
                username: 'john_doe',
                user_status: 'ACTIVE',
                kyc_status: 'VERIFIED',
                email_verified_at: '2024-01-15 10:30:00',
              },
            ],
            explainData: [
              {
                id: 1,
                select_type: 'SIMPLE',
                table: 'users',
                type: 'ref',
                possible_keys: 'idx_email,idx_username',
                key: 'idx_email',
                key_len: '255',
                ref: 'const',
                rows: 1,
                Extra: 'Using where',
              },
            ],
            message: '1 row returned',
          })
        } else {
          setResult({
            status: 'success',
            data: [],
            explainData: [
              {
                id: 1,
                select_type: 'SIMPLE',
                table: 'users',
                type: 'ALL',
                possible_keys: null,
                key: null,
                key_len: null,
                ref: null,
                rows: 1000,
                Extra: 'Using where',
              },
            ],
            message: 'Query executed successfully, no rows returned',
          })
        }
      } else if (sqlBlock.code.toLowerCase().includes('insert')) {
        // INSERT文のモック結果
        setResult({
          status: 'success',
          rowsAffected: 1,
          explainData: [
            {
              id: 1,
              select_type: 'INSERT',
              table: 'users',
              type: null,
              possible_keys: null,
              key: null,
              key_len: null,
              ref: null,
              rows: null,
              Extra: null,
            },
          ],
          message: '1 row inserted successfully',
        })
      } else {
        setResult({
          status: 'error',
          message: 'SQL syntax error: unexpected token',
        })
      }
    }, 1500)
  }

  return (
    <div className={styles.codeBlock}>
      <div className={styles.codeActions}>
        <h4 className={styles.codeTitle}>{sqlBlock.title}</h4>
        <button
          type="button"
          className={styles.executeButton}
          onClick={handleExecute}
          disabled={result?.status === 'loading'}
        >
          {result?.status === 'loading' ? (
            <span className={styles.loadingSpinner}>
              <span className={styles.spinner} />
              実行中...
            </span>
          ) : (
            'SQL実行'
          )}
        </button>
      </div>
      <SqlHighlighter code={sqlBlock.code} />

      {result && (
        <div className={styles.executionResult}>
          <div className={styles.resultHeader}>
            実行結果
            <span
              className={`${styles.resultStatus} ${
                result.status === 'success'
                  ? styles.resultStatusSuccess
                  : styles.resultStatusError
              }`}
            >
              {result.status === 'success' ? '成功' : 'エラー'}
            </span>
          </div>
          <div className={styles.resultContent}>
            {result.status === 'error' ? (
              <div className={styles.resultMessage}>{result.message}</div>
            ) : result.data && result.data.length > 0 ? (
              <div>
                <div className={styles.resultTableSection}>
                  <table className={styles.resultTable}>
                    <thead>
                      <tr>
                        {Object.keys(result.data[0]).map((key) => (
                          <th key={key}>{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.data.map((row) => {
                        const rowId = JSON.stringify(row)
                        return (
                          <tr key={`data-row-${rowId}`}>
                            {Object.entries(row).map(([key, value]) => (
                              <td key={`${key}-${rowId}`}>
                                {String(value ?? '')}
                              </td>
                            ))}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  <div className={styles.resultMessage}>{result.message}</div>
                </div>

                {result.explainData && result.explainData.length > 0 && (
                  <div>
                    <h5 className={styles.explainTitle}>実行計画 (EXPLAIN)</h5>
                    <div className={styles.resultTableSection}>
                      <table className={styles.resultTable}>
                        <thead>
                          <tr>
                            {Object.keys(result.explainData[0]).map((key) => (
                              <th key={key}>{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.explainData.map((row) => {
                            const rowId = JSON.stringify(row)
                            return (
                              <tr key={`explain-row-${rowId}`}>
                                {Object.entries(row).map(([key, value]) => (
                                  <td key={`explain-${key}-${rowId}`}>
                                    {String(value ?? 'NULL')}
                                  </td>
                                ))}
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.resultMessage}>
                {result.message ||
                  (result.rowsAffected !== undefined
                    ? `${result.rowsAffected} rows affected`
                    : 'Query executed successfully')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

type Props = {
  schema: Schema
  errors: ErrorObject[]
}

export const BRD: FC<Props> = ({ errors }) => {
  const businessRequirements: BusinessRequirement[] = [
    {
      id: 'BR-01',
      title: 'ユーザ登録',
      overview: [
        '新規ユーザーが本サービスを利用するために必要なアカウントを作成する機能',
        'ユーザーは必要な情報を入力し、利用規約に同意することでアカウント登録を完了する',
      ],
      useCases: [
        {
          id: 'UC-01',
          title: '正常系',
          steps: [
            'ユーザーはサイト上の「登録」ボタンをクリックする',
            '登録フォームが表示される',
            'ユーザーは以下の情報を入力する\n  - メールアドレス\n  - パスワード\n  - ユーザー名（ニックネーム）\n  - 氏名（フルネーム）\n  - 生年月日',
            'ユーザーは「利用規約」「プライバシーポリシー」への同意チェックボックスにチェックをいれる',
            'ユーザーは登録ボタンをクリックする',
          ],
          sqlBlocks: [
            {
              title: '実行される可能性のある事前チェックDML:',
              code: `-- メールアドレスの重複チェック
SELECT user_id FROM users WHERE email = '[入力されたメールアドレス]';

-- ユーザー名の重複チェック
SELECT user_id FROM users WHERE username = '[入力されたユーザー名]';

-- (もし居住国入力があり、国別のサービス提供可否や年齢制限を確認する場合)
-- SELECT is_serviced, age_restriction FROM countries WHERE country_code = '[選択された国コード]';`,
            },
            {
              title: 'ユーザー情報のデータベースへの挿入',
              code: `INSERT INTO users (
    username,          -- ユーザー名（ニックネーム）
    email,             -- メールアドレス
    hashed_password,   -- ハッシュ化されたパスワード
    salt,              -- パスワードハッシュ化用のソルト
    first_name,        -- 名 (「氏名（フルネーム）」から分割)
    last_name,         -- 姓 (「氏名（フルネーム）」から分割)
    date_of_birth,     -- 生年月日
    user_status,       -- 初期ユーザーステータス
    kyc_status,        -- 初期KYCステータス
    allow_promotions,  -- プロモーションメール受信許可フラグ
    registration_ip,   -- 登録時IPアドレス
    created_at,
    updated_at
) VALUES (
    '[入力されたユーザー名]',
    '[入力されたメールアドレス]',
    '[ハッシュ化されたパスワード]',
    '[生成されたソルト]',
    '[入力された名]',
    '[入力された姓]',
    '[入力された生年月日]',
    'PENDING_VERIFICATION', -- または 'ACTIVE' (メール認証有無による)
    'NOT_SUBMITTED',
    [プロモーション許可フラグの値], -- true or false
    '[ユーザーのIPアドレス]',
    NOW(),
    NOW()
);`,
            },
          ],
          additionalSteps: [
            'システムは年齢制限を満たしているか検証する',
            'システムはユーザー情報をDBに保存する',
            'システムは登録完了メッセージを表示する',
            'システムは登録されたメールアドレスにアカウント有効化のためのメールを送信する',
          ],
        },
        {
          id: 'UC-02',
          title: '入力エラー',
          bullets: [
            '必須項目が未入力の場合、該当箇所にエラーメッセージを表示し、登録処理を中断する',
            '各入力項目で不正な形式が入力された場合、該当箇所にエラーメッセージを表示し、登録処理を中断する（メールアドレス形式でない、パスワードポリシー違反etc.）',
          ],
        },
        {
          id: 'UC-03',
          title: 'メールアドレスの重複',
          bullets: [
            'すでに登録済みのメールアドレスが入力された場合、「このメールアドレスは既に使用されています」等のエラーメッセージを表示し、登録処理を中断する',
          ],
          sqlBlocks: [
            {
              title: 'メールアドレスの重複チェック',
              code: `SELECT user_id FROM users WHERE email = '[入力されたメールアドレス]';`,
            },
          ],
        },
      ],
    },
    {
      id: 'BR-02',
      title: 'ログイン',
      overview: [
        '登録済みユーザーがサービスを利用するために、自身の認証情報（メールアドレスとパスワード）を用いて認証を行う機能',
        '認証成功後、ユーザーはサービス内の各種機能へアクセスできるようになる',
      ],
      useCases: [
        {
          id: 'UC-01',
          title: '正常系',
          steps: [
            'ユーザーはログインフォームにメールアドレス（またはユーザー名）とパスワードを入力し、「ログイン」ボタンをクリックする',
            'システムは入力されたパスワードとデータベースに保存されているハッシュ化パスワードを照合する',
            "パスワードが一致し、かつユーザーステータスがログイン可能（例: 'ACTIVE'）である場合、認証成功とする",
            'システムはユーザーセッションを開始する（セッショントークン発行など）',
            'システムはログイン履歴を記録する',
          ],
          sqlBlocks: [
            {
              title: 'ユーザー情報の取得 (認証用)',
              code: `SELECT
  user_id,
  username,
  hashed_password,
  salt,
  user_status,
  kyc_status,
  email_verified_at
FROM users
WHERE email = '[入力されたメールアドレス]' OR username = '[入力されたメールアドレス／ユーザー名]';`,
            },
            {
              title: 'ログイン履歴の記録',
              code: `INSERT INTO user_login_history (
  user_id,
  login_at,
  ip_address,
  user_agent,
  login_status
) VALUES (
  [認証成功したユーザーのuser_id],
  NOW(),
  '[ユーザーのIPアドレス]',
  '[ユーザーのユーザーエージェント]',
  'SUCCESS'
);`,
            },
          ],
        },
      ],
    },
  ]

  useEffect(() => {
    initSchemaStore({
      current: BEFORE as unknown as Schema,
      previous: AFTER as unknown as Schema,
    })
  }, [])

  const versionData = {
    version: '0.1.0',
    gitHash: process.env.NEXT_PUBLIC_GIT_HASH,
    envName: process.env.NEXT_PUBLIC_ENV_NAME,
    date: process.env.NEXT_PUBLIC_RELEASE_DATE,
    displayedOn: 'web',
  }
  const version = parse(versionSchema, versionData)

  return (
    <div className={styles.container}>
      <TabsRoot defaultValue="erd" className={styles.tabsRoot}>
        <TabsList className={styles.tabsList}>
          <TabsTrigger value="erd" className={styles.tabsTrigger}>
            ERD
          </TabsTrigger>
          <TabsTrigger value="migrations" className={styles.tabsTrigger}>
            Migrations
          </TabsTrigger>
        </TabsList>
        <TabsContent value="erd" className={styles.tabsContent}>
          <VersionProvider version={version}>
            <ERDRenderer
              defaultSidebarOpen={false}
              defaultPanelSizes={[20, 80]}
              errorObjects={errors}
            />
          </VersionProvider>
        </TabsContent>
        <TabsContent value="migrations" className={styles.tabsContent}>
          <MigrationsViewer initialDoc={ddl} />
        </TabsContent>
      </TabsRoot>

      <div className={styles.brdList}>
        {businessRequirements.map((br) => (
          <div key={br.id}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionId}>{br.id}</span>
              {br.title}
            </h2>

            <div className={styles.sectionBody}>
              <div className={styles.overviewSection}>
                {br.overview.map((text, textIndex) => (
                  <p
                    key={`overview-${br.id}-${textIndex}`}
                    className={styles.overviewText}
                  >
                    {text}
                  </p>
                ))}
              </div>

              <div>
                <h3 className={styles.subsectionTitle}>関連テーブル</h3>
                <div className={styles.relatedTables}>
                  <VersionProvider version={version}>
                    <ERDRenderer
                      defaultSidebarOpen={false}
                      defaultPanelSizes={[20, 80]}
                      errorObjects={errors}
                    />
                  </VersionProvider>
                </div>
              </div>

              <div>
                <h3 className={styles.subsectionTitle}>想定ユースケース</h3>
                <div className={styles.usecaseList}>
                  {br.useCases.map((useCase) => (
                    <div key={useCase.id}>
                      <h4 className={styles.usecaseTitle}>
                        <span className={styles.usecaseId}>{useCase.id}</span>
                        {useCase.title}
                      </h4>

                      <div className={styles.usecaseContent}>
                        {useCase.steps && (
                          <ol className={styles.stepList}>
                            {useCase.steps.map((step, stepIndex) => (
                              <li
                                key={`step-${useCase.id}-${stepIndex}`}
                                className={styles.stepItem}
                              >
                                <span className={styles.stepNumber}>
                                  {stepIndex + 1}
                                </span>
                                <div className={styles.stepContent}>
                                  {step.split('\n').map((line, lineIndex) => (
                                    <div
                                      key={`line-${useCase.id}-${stepIndex}-${lineIndex}`}
                                    >
                                      {line}
                                    </div>
                                  ))}
                                </div>
                              </li>
                            ))}
                          </ol>
                        )}

                        {useCase.sqlBlocks?.map((sqlBlock, sqlIndex) => (
                          <ExecutableCodeBlock
                            key={`sql-${useCase.id}-${sqlIndex}`}
                            sqlBlock={sqlBlock}
                          />
                        ))}

                        {useCase.additionalSteps && (
                          <ol
                            className={styles.stepList}
                            start={(useCase.steps?.length ?? 0) + 1}
                          >
                            {useCase.additionalSteps.map(
                              (step, additionalIndex) => (
                                <li
                                  key={`additional-${useCase.id}-${additionalIndex}`}
                                  className={styles.stepItem}
                                >
                                  <span className={styles.stepNumber}>
                                    {(useCase.steps?.length ?? 0) +
                                      additionalIndex +
                                      1}
                                  </span>
                                  <div className={styles.stepContent}>
                                    {step}
                                  </div>
                                </li>
                              ),
                            )}
                          </ol>
                        )}

                        {useCase.bullets && (
                          <ul className={styles.bulletList}>
                            {useCase.bullets.map((bullet, bulletIndex) => (
                              <li
                                key={`bullet-${useCase.id}-${bulletIndex}`}
                                className={styles.bulletItem}
                              >
                                {bullet}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
