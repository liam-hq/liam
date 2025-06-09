'use client'

import { Chat } from '@/components/Chat'
import type { Schema } from '@liam-hq/db-structure'
import type { FC } from 'react'
import { BRD, type ErrorObject } from './BRD'
import type {
  BusinessRequirement,
  ExecutionResult,
  SqlExecutor,
  VersionInfo,
} from './BRD/types'
import styles from './Panel.module.css'
import { ddl } from './constants'

type Props = {
  schema: Schema
  errors: ErrorObject[]
}

// モックのビジネス要件データ
const mockBusinessRequirements: BusinessRequirement[] = [
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
    relatedSchema: {
      tables: {
        users: {
          name: 'users',
          comment: 'ユーザー情報管理テーブル',
          columns: {
            user_id: {
              name: 'user_id',
              type: 'uuid',
              default: null,
              check: null,
              primary: true,
              unique: false,
              notNull: true,
              comment: 'ユーザーの一意識別子',
            },
            username: {
              name: 'username',
              type: 'varchar(255)',
              default: null,
              check: null,
              primary: false,
              unique: false,
              notNull: true,
              comment: 'ユーザー名（ニックネーム）',
            },
            email: {
              name: 'email',
              type: 'varchar(255)',
              default: null,
              check: null,
              primary: false,
              unique: false,
              notNull: true,
              comment: 'メールアドレス',
            },
          },
          indexes: {
            idx_email: {
              name: 'idx_email',
              unique: true,
              columns: ['email'],
              type: 'btree',
            },
          },
          constraints: {},
        },
        countries: {
          name: 'countries',
          comment: '国・地域情報テーブル',
          columns: {
            country_code: {
              name: 'country_code',
              type: 'varchar(3)',
              default: null,
              check: null,
              primary: true,
              unique: false,
              notNull: true,
              comment: '国コード',
            },
            is_serviced: {
              name: 'is_serviced',
              type: 'boolean',
              default: null,
              check: null,
              primary: false,
              unique: false,
              notNull: true,
              comment: 'サービス提供可否',
            },
          },
          indexes: {},
          constraints: {},
        },
      },
      relationships: {},
      tableGroups: {},
    },
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
    relatedSchema: {
      tables: {
        users: {
          name: 'users',
          comment: 'ユーザー情報管理テーブル',
          columns: {
            user_id: {
              name: 'user_id',
              type: 'uuid',
              default: null,
              check: null,
              primary: true,
              unique: false,
              notNull: true,
              comment: 'ユーザーの一意識別子',
            },
            username: {
              name: 'username',
              type: 'varchar(255)',
              default: null,
              check: null,
              primary: false,
              unique: false,
              notNull: true,
              comment: 'ユーザー名（ニックネーム）',
            },
            email: {
              name: 'email',
              type: 'varchar(255)',
              default: null,
              check: null,
              primary: false,
              unique: false,
              notNull: true,
              comment: 'メールアドレス',
            },
          },
          indexes: {
            idx_email: {
              name: 'idx_email',
              unique: true,
              columns: ['email'],
              type: 'btree',
            },
          },
          constraints: {},
        },
        user_login_history: {
          name: 'user_login_history',
          comment: 'ユーザーログイン履歴テーブル',
          columns: {
            id: {
              name: 'id',
              type: 'bigint',
              default: null,
              check: null,
              primary: true,
              unique: false,
              notNull: true,
              comment: 'ログイン履歴ID',
            },
            user_id: {
              name: 'user_id',
              type: 'uuid',
              default: null,
              check: null,
              primary: false,
              unique: false,
              notNull: true,
              comment: 'ユーザーID',
            },
            login_at: {
              name: 'login_at',
              type: 'timestamp',
              default: null,
              check: null,
              primary: false,
              unique: false,
              notNull: true,
              comment: 'ログイン日時',
            },
            ip_address: {
              name: 'ip_address',
              type: 'varchar(45)',
              default: null,
              check: null,
              primary: false,
              unique: false,
              notNull: true,
              comment: 'IPアドレス',
            },
            login_status: {
              name: 'login_status',
              type: 'varchar(20)',
              default: null,
              check: null,
              primary: false,
              unique: false,
              notNull: true,
              comment: 'ログインステータス',
            },
          },
          indexes: {},
          constraints: {},
        },
      },
      relationships: {},
      tableGroups: {},
    },
  },
]

// モックのSQL実行関数
const mockSqlExecutor: SqlExecutor = async (
  code: string,
): Promise<ExecutionResult> => {
  // 実行結果をシミュレート
  await new Promise((resolve) => setTimeout(resolve, 1500))

  if (code.toLowerCase().includes('select')) {
    // SELECT文のモック結果
    if (code.includes('user_id FROM users WHERE email')) {
      return {
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
      }
    }

    if (code.includes('SELECT\n  user_id')) {
      return {
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
      }
    }

    return {
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
    }
  }

  if (code.toLowerCase().includes('insert')) {
    // INSERT文のモック結果
    return {
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
    }
  }

  return {
    status: 'error',
    message: 'SQL syntax error: unexpected token',
  }
}

// モックのバージョン情報
const mockVersionInfo: VersionInfo = {
  version: '0.1.0',
  gitHash: process.env.NEXT_PUBLIC_GIT_HASH,
  envName: process.env.NEXT_PUBLIC_ENV_NAME,
  date: process.env.NEXT_PUBLIC_RELEASE_DATE,
  displayedOn: 'web',
}

export const Panel: FC<Props> = ({ schema, errors }) => {
  return (
    <div className={styles.container}>
      <div className={styles.columns}>
        <div className={styles.chatSection}>
          <Chat schemaData={schema} />
        </div>
        <BRD
          schema={schema}
          errors={errors}
          businessRequirements={mockBusinessRequirements}
          sqlExecutor={mockSqlExecutor}
          versionInfo={mockVersionInfo}
          schemaData={{
            current: schema,
            previous: schema,
          }}
          ddl={ddl}
          reviewComments={[
            {
              fromLine: 7,
              toLine: 7,
              severity: 'High',
              message:
                '【パフォーマンス】外部キーにインデックスがありません。JOINやWHERE句での検索性能が著しく低下するため、インデックスの作成を強く推奨します。例: CREATE INDEX idx_documents_parent_id ON documents (parent_id);',
            },
            {
              fromLine: 7,
              toLine: 7,
              severity: 'Medium',
              message:
                '【データ安全】`on delete cascade` は、親ドキュメント削除時に意図せず大量の子孫ドキュメントを削除するリスクがあります。安全のため、アプリケーション側で削除処理を制御するか、`on delete restrict`の使用を検討してください。',
            },
            {
              fromLine: 9,
              toLine: 9,
              severity: 'Medium',
              message:
                '【整合性】`updated_at`はレコード作成時にしか設定されません。更新日時を正しく反映するには、`BEFORE UPDATE`トリガーで自動更新する仕組みが必要です。',
            },
            {
              fromLine: 10,
              toLine: 10,
              severity: 'Low',
              message:
                '【整合性】`is_folder`フラグだけでは、「フォルダなのにコンテンツを持つ」といったデータの不整合を防げません。アプリケーション側で厳密な制御を行うか、制約(CHECK)の追加を検討してください。',
            },
            {
              fromLine: 15,
              toLine: 15,
              severity: 'High',
              message:
                '【パフォーマンス】外部キーにインデックスがありません。ドキュメントIDに基づいたバージョン検索の性能が低下するため、インデックスの作成を強く推奨します。例: CREATE INDEX idx_document_versions_document_id ON document_versions (document_id);',
            },
            {
              fromLine: 24,
              toLine: 24,
              severity: 'Low',
              message:
                '【パフォーマンス】`name`カラムの`unique`制約によりインデックスが自動作成されるため、タグ名での検索は効率的です。これは良い設計です。',
            },
            {
              fromLine: 27,
              toLine: 31,
              severity: 'High',
              message:
                '【パフォーマンス】複合主キー `(document_id, tag_id)` は`document_id`での検索には有効ですが、`tag_id`単体での検索性能を向上させるために、`tag_id`カラムにも個別インデックスを作成することを推奨します。例: `CREATE INDEX idx_document_tags_tag_id ON document_tags (tag_id);`',
            },
          ]}
        />
      </div>
    </div>
  )
}
