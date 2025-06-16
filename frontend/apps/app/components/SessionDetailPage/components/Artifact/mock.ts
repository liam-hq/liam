import type { BusinessRequirement } from './components/BRDList/types'

export const MIGRATIONS_DOC = `
-- Migrations will appear here as you chat with AI
create table documents (
  id bigint primary key generated always as identity,
  title text not null,
  parent_id bigint references documents (id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  is_folder boolean default false
);
create table document_versions (
  id bigint primary key generated always as identity,
  document_id bigint references documents (id) on delete cascade,
  version_number int not null,
  content text,
  created_at timestamp with time zone default now(),
  unique (document_id, version_number)
);
create table tags (
  id bigint primary key generated always as identity,
  name text not null unique
);
create table document_tags (
  document_id bigint references documents (id) on delete cascade,
  tag_id bigint references tags (id) on delete cascade,
  primary key (document_id, tag_id)
);
`

export const REVIEW_COMMENTS = [
  {
    fromLine: 7,
    toLine: 7,
    severity: 'High' as const,
    message:
      '【パフォーマンス】外部キーにインデックスがありません。JOINやWHERE句での検索性能が著しく低下するため、インデックスの作成を強く推奨します。例: CREATE INDEX idx_documents_parent_id ON documents (parent_id);',
  },
  {
    fromLine: 7,
    toLine: 7,
    severity: 'Medium' as const,
    message:
      '【データ安全】`on delete cascade` は、親ドキュメント削除時に意図せず大量の子孫ドキュメントを削除するリスクがあります。安全のため、アプリケーション側で削除処理を制御するか、`on delete restrict`の使用を検討してください。',
  },
  {
    fromLine: 9,
    toLine: 9,
    severity: 'Medium' as const,
    message:
      '【整合性】`updated_at`はレコード作成時にしか設定されません。更新日時を正しく反映するには、`BEFORE UPDATE`トリガーで自動更新する仕組みが必要です。',
  },
  {
    fromLine: 10,
    toLine: 10,
    severity: 'Low' as const,
    message:
      '【整合性】`is_folder`フラグだけでは、「フォルダなのにコンテンツを持つ」といったデータの不整合を防げません。アプリケーション側で厳密な制御を行うか、制約(CHECK)の追加を検討してください。',
  },
  {
    fromLine: 15,
    toLine: 15,
    severity: 'High' as const,
    message:
      '【パフォーマンス】外部キーにインデックスがありません。ドキュメントIDに基づいたバージョン検索の性能が低下するため、インデックスの作成を強く推奨します。例: CREATE INDEX idx_document_versions_document_id ON document_versions (document_id);',
  },
  {
    fromLine: 24,
    toLine: 24,
    severity: 'Low' as const,
    message:
      '【パフォーマンス】`name`カラムの`unique`制約によりインデックスが自動作成されるため、タグ名での検索は効率的です。これは良い設計です。',
  },
  {
    fromLine: 27,
    toLine: 31,
    severity: 'High' as const,
    message:
      '【パフォーマンス】複合主キー `(document_id, tag_id)` は`document_id`での検索には有効ですが、`tag_id`単体での検索性能を向上させるために、`tag_id`カラムにも個別インデックスを作成することを推奨します。例: `CREATE INDEX idx_document_tags_tag_id ON document_tags (tag_id);`',
  },
]

export const BRD_LIST: BusinessRequirement[] = [
  {
    id: 'BRD-001',
    name: 'User Registration',
    overview: [
      'A feature that allows new users to create an account necessary to use this service',
      'Users complete account registration by entering required information and agreeing to the terms of service',
    ],
    relatedSchema: {
      tables: {
        users: {
          name: 'users',
          comment: 'User information management table',
          columns: {
            user_id: {
              name: 'user_id',
              type: 'uuid',
              default: null,
              check: null,
              primary: true,
              unique: false,
              notNull: true,
              comment: 'Unique identifier for the user',
            },
            username: {
              name: 'username',
              type: 'varchar(255)',
              default: null,
              check: null,
              primary: false,
              unique: false,
              notNull: true,
              comment: 'Username (nickname)',
            },
            email: {
              name: 'email',
              type: 'varchar(255)',
              default: null,
              check: null,
              primary: false,
              unique: false,
              notNull: true,
              comment: 'Email address',
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
              comment: 'Country code',
            },
            is_serviced: {
              name: 'is_serviced',
              type: 'boolean',
              default: null,
              check: null,
              primary: false,
              unique: false,
              notNull: true,
              comment: 'Service availability flag',
            },
          },
          indexes: {},
          constraints: {},
        },
      },
      relationships: {},
      tableGroups: {},
    },
    useCases: [
      {
        id: 'UC-001',
        name: 'Normal Flow',
        steps: [
          {
            order: 1,
            description: 'User clicks the "Register" button on the site',
          },
          {
            order: 2,
            description: 'Registration form is displayed',
          },
          {
            order: 3,
            description:
              'User enters the following information:\n  - Email address\n  - Password\n  - Username (nickname)\n  - Full name\n  - Date of birth',
          },
          {
            order: 4,
            description:
              'User checks the checkbox to agree to the "Terms of Service" and "Privacy Policy"',
          },
          {
            order: 5,
            description: 'User clicks the registration button',
            dmlBlocks: [
              {
                name: 'Email duplication check',
                code: `SELECT user_id FROM users WHERE email = '[entered email address]';`,
              },
              {
                name: 'Username duplication check',
                code: `SELECT user_id FROM users WHERE username = '[entered username]';`,
              },
            ],
          },
          {
            order: 6,
            description: 'System verifies if the age restriction is met',
          },
          {
            order: 7,
            description: 'System stores user information in the database',
            dmlBlocks: [
              {
                name: 'Insert user information into database',
                code: `INSERT INTO users (
    username,          -- Username (nickname)
    email,             -- Email address
    hashed_password,   -- Hashed password
    salt,              -- Salt for password hashing
    first_name,        -- First name (split from "full name")
    last_name,         -- Last name (split from "full name")
    date_of_birth,     -- Date of birth
    user_status,       -- Initial user status
    kyc_status,        -- Initial KYC status
    allow_promotions,  -- Promotional email opt-in flag
    registration_ip,   -- IP address at registration
    created_at,
    updated_at
) VALUES (
    '[entered username]',
    '[entered email address]',
    '[hashed password]',
    '[generated salt]',
    '[entered first name]',
    '[entered last name]',
    '[entered date of birth]',
    'PENDING_VERIFICATION', -- or 'ACTIVE' (depending on email verification)
    'NOT_SUBMITTED',
    [promotion permission flag value], -- true or false
    '[user IP address]',
    NOW(),
    NOW()
);`,
              },
            ],
          },
          {
            order: 8,
            description: 'System displays registration completion message',
          },
          {
            order: 9,
            description:
              'System sends an account activation email to the registered email address',
          },
        ],
      },
      {
        id: 'UC-002',
        name: 'Input Error',
        steps: [
          {
            order: 1,
            description:
              'If required fields are left blank, display error messages at the corresponding locations and abort the registration process\nIf invalid formats are entered in any input field, display error messages at the corresponding locations and abort the registration process (invalid email format, password policy violation, etc.)',
          },
        ],
      },
      {
        id: 'UC-003',
        name: 'Email Duplication',
        steps: [
          {
            order: 1,
            description:
              'If an already registered email address is entered, display an error message such as "This email address is already in use" and abort the registration process',
            dmlBlocks: [
              {
                name: 'Check email duplication',
                code: `SELECT user_id FROM users WHERE email = '[entered email address]';`,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'BRD-002',
    name: 'Login',
    overview: [
      'A feature that allows registered users to authenticate using their credentials (email and password) to access the service',
      'After successful authentication, users can access various features within the service',
    ],
    relatedSchema: {
      tables: {
        users: {
          name: 'users',
          comment: 'User information management table',
          columns: {
            user_id: {
              name: 'user_id',
              type: 'uuid',
              default: null,
              check: null,
              primary: true,
              unique: false,
              notNull: true,
              comment: 'Unique user identifier',
            },
            username: {
              name: 'username',
              type: 'varchar(255)',
              default: null,
              check: null,
              primary: false,
              unique: false,
              notNull: true,
              comment: 'Username (nickname)',
            },
            email: {
              name: 'email',
              type: 'varchar(255)',
              default: null,
              check: null,
              primary: false,
              unique: false,
              notNull: true,
              comment: 'Email address',
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
          comment: 'User login history table',
          columns: {
            id: {
              name: 'id',
              type: 'bigint',
              default: null,
              check: null,
              primary: true,
              unique: false,
              notNull: true,
              comment: 'Login history ID',
            },
            user_id: {
              name: 'user_id',
              type: 'uuid',
              default: null,
              check: null,
              primary: false,
              unique: false,
              notNull: true,
              comment: 'User ID',
            },
            login_at: {
              name: 'login_at',
              type: 'timestamp',
              default: null,
              check: null,
              primary: false,
              unique: false,
              notNull: true,
              comment: 'Login date and time',
            },
            ip_address: {
              name: 'ip_address',
              type: 'varchar(45)',
              default: null,
              check: null,
              primary: false,
              unique: false,
              notNull: true,
              comment: 'IP address',
            },
            login_status: {
              name: 'login_status',
              type: 'varchar(20)',
              default: null,
              check: null,
              primary: false,
              unique: false,
              notNull: true,
              comment: 'Login status',
            },
          },
          indexes: {},
          constraints: {},
        },
      },
      relationships: {},
      tableGroups: {},
    },
    useCases: [
      {
        id: 'UC-001d',
        name: 'Normal Flow',
        steps: [
          {
            order: 1,
            description:
              'User enters email address (or username) and password in the login form and clicks the "Login" button',
          },
          {
            order: 2,
            description:
              'System compares the entered password with the hashed password stored in the database',
          },
          {
            order: 3,
            description:
              "If the password matches and the user status allows login (e.g., 'ACTIVE'), authentication is successful",
            dmlBlocks: [
              {
                name: 'Retrieve user information (for authentication)',
                code: `SELECT
  user_id,
  username,
  hashed_password,
  salt,
  user_status,
  kyc_status,
  email_verified_at
FROM users
WHERE email = '[entered email address]' OR username = '[entered email address/username]';`,
              },
            ],
          },
          {
            order: 4,
            description:
              'System initiates a user session (such as issuing a session token)',
          },
          {
            order: 5,
            description: 'System records the login history',
            dmlBlocks: [
              {
                name: 'Recording login history',
                code: `INSERT INTO user_login_history (
  user_id,
  login_at,
  ip_address,
  user_agent,
  login_status
) VALUES (
  [user_id of successfully authenticated user],
  NOW(),
  '[user IP address]',
  '[user agent]',
  'SUCCESS'
);`,
              },
            ],
          },
        ],
      },
    ],
  },
]
