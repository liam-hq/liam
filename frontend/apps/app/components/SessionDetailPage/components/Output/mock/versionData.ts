import type { Schema } from '@liam-hq/db-structure'
import type { VersionData } from '../contexts/OutputUIContext'

// v0 - シンプルなユーザー管理システム
const v0Schema: Schema = {
  tables: {
    users: {
      name: 'users',
      columns: {
        id: {
          name: 'id',
          type: 'bigint',
          primary: true,
          unique: false,
          notNull: true,
          default: null,
          check: null,
          comment: 'Primary key for users table',
        },
        name: {
          name: 'name',
          type: 'text',
          primary: false,
          unique: false,
          notNull: true,
          default: null,
          check: null,
          comment: 'User full name',
        },
        email: {
          name: 'email',
          type: 'text',
          primary: false,
          unique: true,
          notNull: true,
          default: null,
          check: null,
          comment: 'User email address',
        },
        created_at: {
          name: 'created_at',
          type: 'timestamp with time zone',
          primary: false,
          unique: false,
          notNull: true,
          default: 'now()',
          check: null,
          comment: 'Record creation timestamp',
        },
      },
      comment: 'User accounts table',
      indexes: {},
      constraints: {},
    },
  },
  relationships: {},
  tableGroups: {},
}

const v0ArtifactContent = `## データベース設計 v0

このバージョンでは、基本的なユーザー管理機能を提供します。

### 主要機能
- ユーザーアカウント管理
- 基本的なプロファイル情報

### テーブル構成
- **users**: ユーザーの基本情報を管理

### 設計の特徴
- シンプルな構造で必要最小限の機能を提供
- 将来の拡張を考慮した設計`

const v0SchemaUpdatesDoc = `-- v0: 基本的なユーザー管理システム
create table users (
  id bigint primary key generated always as identity,
  name text not null,
  email text not null unique,
  created_at timestamp with time zone default now()
);

comment on table users is 'User accounts table';
comment on column users.id is 'Primary key for users table';
comment on column users.name is 'User full name';
comment on column users.email is 'User email address';
comment on column users.created_at is 'Record creation timestamp';`

const v0Comments = [
  {
    fromLine: 3,
    toLine: 3,
    severity: 'Medium' as const,
    message:
      'emailカラムにインデックスが自動作成されますが、ログイン機能を想定している場合は、追加でハッシュインデックスも検討してください。',
  },
]

// v1 - プロジェクト管理機能を追加
const v1Schema: Schema = {
  tables: {
    users: {
      name: 'users',
      columns: {
        id: {
          name: 'id',
          type: 'bigint',
          primary: true,
          unique: false,
          notNull: true,
          default: null,
          check: null,
          comment: 'Primary key for users table',
        },
        name: {
          name: 'name',
          type: 'text',
          primary: false,
          unique: false,
          notNull: true,
          default: null,
          check: null,
          comment: 'User full name',
        },
        email: {
          name: 'email',
          type: 'text',
          primary: false,
          unique: true,
          notNull: true,
          default: null,
          check: null,
          comment: 'User email address',
        },
        created_at: {
          name: 'created_at',
          type: 'timestamp with time zone',
          primary: false,
          unique: false,
          notNull: true,
          default: 'now()',
          check: null,
          comment: 'Record creation timestamp',
        },
        updated_at: {
          name: 'updated_at',
          type: 'timestamp with time zone',
          primary: false,
          unique: false,
          notNull: true,
          default: 'now()',
          check: null,
          comment: 'Record update timestamp',
        },
      },
      comment: 'User accounts table',
      indexes: {},
      constraints: {},
    },
    projects: {
      name: 'projects',
      columns: {
        id: {
          name: 'id',
          type: 'bigint',
          primary: true,
          unique: false,
          notNull: true,
          default: null,
          check: null,
          comment: 'Primary key for projects table',
        },
        name: {
          name: 'name',
          type: 'text',
          primary: false,
          unique: false,
          notNull: true,
          default: null,
          check: null,
          comment: 'Project name',
        },
        description: {
          name: 'description',
          type: 'text',
          primary: false,
          unique: false,
          notNull: false,
          default: null,
          check: null,
          comment: 'Project description',
        },
        owner_id: {
          name: 'owner_id',
          type: 'bigint',
          primary: false,
          unique: false,
          notNull: true,
          default: null,
          check: null,
          comment: 'Project owner user ID',
        },
        created_at: {
          name: 'created_at',
          type: 'timestamp with time zone',
          primary: false,
          unique: false,
          notNull: true,
          default: 'now()',
          check: null,
          comment: 'Record creation timestamp',
        },
        updated_at: {
          name: 'updated_at',
          type: 'timestamp with time zone',
          primary: false,
          unique: false,
          notNull: true,
          default: 'now()',
          check: null,
          comment: 'Record update timestamp',
        },
      },
      comment: 'Projects table',
      indexes: {},
      constraints: {},
    },
  },
  relationships: {
    projects_owner: {
      name: 'projects_owner',
      primaryTableName: 'users',
      primaryColumnName: 'id',
      foreignTableName: 'projects',
      foreignColumnName: 'owner_id',
      cardinality: 'ONE_TO_MANY',
      updateConstraint: 'CASCADE',
      deleteConstraint: 'CASCADE',
    },
  },
  tableGroups: {},
}

const v1ArtifactContent = `## データベース設計 v1

このバージョンでは、プロジェクト管理機能を追加しました。

### 新機能
- プロジェクト作成・管理
- プロジェクトオーナーシップ
- ユーザーとプロジェクトの関連付け

### テーブル構成
- **users**: ユーザーの基本情報（updated_atカラム追加）
- **projects**: プロジェクト情報を管理

### 設計の改善点
- updated_atカラムの追加によりデータ更新の追跡が可能
- 外部キー制約によるデータ整合性の確保
- プロジェクトオーナーの明確な管理`

const v1SchemaUpdatesDoc = `-- v1: プロジェクト管理機能を追加
-- usersテーブルにupdated_atカラムを追加
alter table users add column updated_at timestamp with time zone default now();
comment on column users.updated_at is 'Record update timestamp';

-- projectsテーブルを作成
create table projects (
  id bigint primary key generated always as identity,
  name text not null,
  description text,
  owner_id bigint not null references users (id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table projects is 'Projects table';
comment on column projects.id is 'Primary key for projects table';
comment on column projects.name is 'Project name';
comment on column projects.description is 'Project description';
comment on column projects.owner_id is 'Project owner user ID';
comment on column projects.created_at is 'Record creation timestamp';
comment on column projects.updated_at is 'Record update timestamp';

-- インデックスを作成
create index idx_projects_owner_id on projects (owner_id);`

const v1Comments = [
  {
    fromLine: 2,
    toLine: 2,
    severity: 'Medium' as const,
    message:
      'updated_atカラムの自動更新にはトリガーが必要です。現在は手動更新となっています。',
  },
  {
    fromLine: 6,
    toLine: 6,
    severity: 'High' as const,
    message:
      'CASCADE削除は危険な場合があります。ユーザー削除時に全プロジェクトが削除されるため、RESTRICT制約も検討してください。',
  },
  {
    fromLine: 19,
    toLine: 19,
    severity: 'Low' as const,
    message:
      'プロジェクト検索用にname カラムにもインデックスを追加することを推奨します。',
  },
]

// v2 - タスク管理機能を追加
const v2Schema: Schema = {
  tables: {
    users: {
      name: 'users',
      columns: {
        id: {
          name: 'id',
          type: 'bigint',
          primary: true,
          unique: false,
          notNull: true,
          default: null,
          check: null,
          comment: 'Primary key for users table',
        },
        name: {
          name: 'name',
          type: 'text',
          primary: false,
          unique: false,
          notNull: true,
          default: null,
          check: null,
          comment: 'User full name',
        },
        email: {
          name: 'email',
          type: 'text',
          primary: false,
          unique: true,
          notNull: true,
          default: null,
          check: null,
          comment: 'User email address',
        },
        created_at: {
          name: 'created_at',
          type: 'timestamp with time zone',
          primary: false,
          unique: false,
          notNull: true,
          default: 'now()',
          check: null,
          comment: 'Record creation timestamp',
        },
        updated_at: {
          name: 'updated_at',
          type: 'timestamp with time zone',
          primary: false,
          unique: false,
          notNull: true,
          default: 'now()',
          check: null,
          comment: 'Record update timestamp',
        },
      },
      comment: 'User accounts table',
      indexes: {},
      constraints: {},
    },
    projects: {
      name: 'projects',
      columns: {
        id: {
          name: 'id',
          type: 'bigint',
          primary: true,
          unique: false,
          notNull: true,
          default: null,
          check: null,
          comment: 'Primary key for projects table',
        },
        name: {
          name: 'name',
          type: 'text',
          primary: false,
          unique: false,
          notNull: true,
          default: null,
          check: null,
          comment: 'Project name',
        },
        description: {
          name: 'description',
          type: 'text',
          primary: false,
          unique: false,
          notNull: false,
          default: null,
          check: null,
          comment: 'Project description',
        },
        owner_id: {
          name: 'owner_id',
          type: 'bigint',
          primary: false,
          unique: false,
          notNull: true,
          default: null,
          check: null,
          comment: 'Project owner user ID',
        },
        status: {
          name: 'status',
          type: 'text',
          primary: false,
          unique: false,
          notNull: true,
          default: "'active'",
          check: "status IN ('active', 'completed', 'archived')",
          comment: 'Project status',
        },
        created_at: {
          name: 'created_at',
          type: 'timestamp with time zone',
          primary: false,
          unique: false,
          notNull: true,
          default: 'now()',
          check: null,
          comment: 'Record creation timestamp',
        },
        updated_at: {
          name: 'updated_at',
          type: 'timestamp with time zone',
          primary: false,
          unique: false,
          notNull: true,
          default: 'now()',
          check: null,
          comment: 'Record update timestamp',
        },
      },
      comment: 'Projects table',
      indexes: {},
      constraints: {},
    },
    tasks: {
      name: 'tasks',
      columns: {
        id: {
          name: 'id',
          type: 'bigint',
          primary: true,
          unique: false,
          notNull: true,
          default: null,
          check: null,
          comment: 'Primary key for tasks table',
        },
        title: {
          name: 'title',
          type: 'text',
          primary: false,
          unique: false,
          notNull: true,
          default: null,
          check: null,
          comment: 'Task title',
        },
        description: {
          name: 'description',
          type: 'text',
          primary: false,
          unique: false,
          notNull: false,
          default: null,
          check: null,
          comment: 'Task description',
        },
        project_id: {
          name: 'project_id',
          type: 'bigint',
          primary: false,
          unique: false,
          notNull: true,
          default: null,
          check: null,
          comment: 'Associated project ID',
        },
        assignee_id: {
          name: 'assignee_id',
          type: 'bigint',
          primary: false,
          unique: false,
          notNull: false,
          default: null,
          check: null,
          comment: 'Assigned user ID',
        },
        status: {
          name: 'status',
          type: 'text',
          primary: false,
          unique: false,
          notNull: true,
          default: "'pending'",
          check:
            "status IN ('pending', 'in_progress', 'completed', 'cancelled')",
          comment: 'Task status',
        },
        priority: {
          name: 'priority',
          type: 'integer',
          primary: false,
          unique: false,
          notNull: true,
          default: '3',
          check: 'priority >= 1 AND priority <= 5',
          comment: 'Task priority (1: highest, 5: lowest)',
        },
        due_date: {
          name: 'due_date',
          type: 'date',
          primary: false,
          unique: false,
          notNull: false,
          default: null,
          check: null,
          comment: 'Task due date',
        },
        created_at: {
          name: 'created_at',
          type: 'timestamp with time zone',
          primary: false,
          unique: false,
          notNull: true,
          default: 'now()',
          check: null,
          comment: 'Record creation timestamp',
        },
        updated_at: {
          name: 'updated_at',
          type: 'timestamp with time zone',
          primary: false,
          unique: false,
          notNull: true,
          default: 'now()',
          check: null,
          comment: 'Record update timestamp',
        },
      },
      comment: 'Tasks table',
      indexes: {},
      constraints: {},
    },
  },
  relationships: {
    projects_owner: {
      name: 'projects_owner',
      primaryTableName: 'users',
      primaryColumnName: 'id',
      foreignTableName: 'projects',
      foreignColumnName: 'owner_id',
      cardinality: 'ONE_TO_MANY',
      updateConstraint: 'CASCADE',
      deleteConstraint: 'RESTRICT',
    },
    tasks_project: {
      name: 'tasks_project',
      primaryTableName: 'projects',
      primaryColumnName: 'id',
      foreignTableName: 'tasks',
      foreignColumnName: 'project_id',
      cardinality: 'ONE_TO_MANY',
      updateConstraint: 'CASCADE',
      deleteConstraint: 'CASCADE',
    },
    tasks_assignee: {
      name: 'tasks_assignee',
      primaryTableName: 'users',
      primaryColumnName: 'id',
      foreignTableName: 'tasks',
      foreignColumnName: 'assignee_id',
      cardinality: 'ONE_TO_MANY',
      updateConstraint: 'CASCADE',
      deleteConstraint: 'SET_NULL',
    },
  },
  tableGroups: {
    user_management: {
      name: 'user_management',
      tables: ['users'],
      comment: 'ユーザー管理関連テーブル',
    },
    project_management: {
      name: 'project_management',
      tables: ['projects', 'tasks'],
      comment: 'プロジェクト・タスク管理関連テーブル',
    },
  },
}

const v2ArtifactContent = `## データベース設計 v2

このバージョンでは、タスク管理機能を追加し、プロジェクト管理システムを完成させました。

### 新機能
- タスク作成・管理
- タスクの担当者割り当て
- 優先度とステータス管理
- 期限管理
- テーブルグループによる論理的な分類

### テーブル構成
- **users**: ユーザーの基本情報
- **projects**: プロジェクト情報（ステータス管理追加）
- **tasks**: タスク情報を管理（新規追加）

### 設計の改善点
- プロジェクトにステータス管理を追加
- CHECK制約による データ整合性の強化
- 適切な外部キー制約（CASCADE/RESTRICT/SET_NULL）
- テーブルグループによる論理的な分類

### データ整合性
- プロジェクトとタスクの関連性を保証
- ユーザー削除時の適切な制約設定
- ステータスと優先度の有効値制限`

const v2SchemaUpdatesDoc = `-- usersテーブルにupdated_atカラムを追加
alter table users add column updated_at timestamp with time zone default now();
comment on column users.updated_at is 'Record update timestamp';

-- projectsテーブルを作成
create table projects (
  id bigint primary key generated always as identity,
  name text not null,
  description text,
  owner_id bigint not null references users (id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table projects is 'Projects table';
comment on column projects.id is 'Primary key for projects table';
comment on column projects.name is 'Project name';
comment on column projects.description is 'Project description';
comment on column projects.owner_id is 'Project owner user ID';
comment on column projects.created_at is 'Record creation timestamp';
comment on column projects.updated_at is 'Record update timestamp';

-- インデックスを作成
create index idx_projects_owner_id on projects (owner_id);

-- v2: タスク管理機能を追加
-- projectsテーブルにstatusカラムを追加
alter table projects add column status text not null default 'active';
alter table projects add constraint projects_status_check 
  check (status in ('active', 'completed', 'archived'));
comment on column projects.status is 'Project status';

-- 外部キー制約を変更（より安全に）
alter table projects drop constraint projects_owner_id_fkey;
alter table projects add constraint projects_owner_id_fkey 
  foreign key (owner_id) references users (id) on delete restrict;

-- tasksテーブルを作成
create table tasks (
  id bigint primary key generated always as identity,
  title text not null,
  description text,
  project_id bigint not null references projects (id) on delete cascade,
  assignee_id bigint references users (id) on delete set null,
  status text not null default 'pending',
  priority integer not null default 3,
  due_date date,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint tasks_status_check 
    check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  constraint tasks_priority_check 
    check (priority >= 1 and priority <= 5)
);

comment on table tasks is 'Tasks table';
comment on column tasks.id is 'Primary key for tasks table';
comment on column tasks.title is 'Task title';
comment on column tasks.description is 'Task description';
comment on column tasks.project_id is 'Associated project ID';
comment on column tasks.assignee_id is 'Assigned user ID';
comment on column tasks.status is 'Task status';
comment on column tasks.priority is 'Task priority (1: highest, 5: lowest)';
comment on column tasks.due_date is 'Task due date';
comment on column tasks.created_at is 'Record creation timestamp';
comment on column tasks.updated_at is 'Record update timestamp';

-- インデックスを作成
create index idx_tasks_project_id on tasks (project_id);
create index idx_tasks_assignee_id on tasks (assignee_id);
create index idx_tasks_status on tasks (status);
create index idx_tasks_due_date on tasks (due_date);
create index idx_projects_status on projects (status);`

const v2Comments = [
  {
    fromLine: 8,
    toLine: 9,
    severity: 'High' as const,
    message:
      '外部キー制約の変更は既存データに影響を与える可能性があります。運用環境では慎重にマイグレーションを実行してください。',
  },
  {
    fromLine: 24,
    toLine: 26,
    severity: 'Medium' as const,
    message:
      'CHECK制約により不正なデータの挿入は防げますが、アプリケーション側でも同様の検証を実装することを推奨します。',
  },
  {
    fromLine: 39,
    toLine: 42,
    severity: 'Low' as const,
    message:
      'インデックスが適切に設定されています。タスクの検索性能が向上します。',
  },
  {
    fromLine: 15,
    toLine: 15,
    severity: 'Medium' as const,
    message:
      'assignee_idがNULLの場合、未割り当てタスクとして扱われます。この仕様がビジネス要件と一致しているか確認してください。',
  },
]

export const VERSION_DATA: Record<number, VersionData> = {
  0: {
    schema: v0Schema,
    artifactContent: v0ArtifactContent,
    schemaUpdatesDoc: v0SchemaUpdatesDoc,
    comments: v0Comments,
  },
  1: {
    schema: v1Schema,
    artifactContent: v1ArtifactContent,
    schemaUpdatesDoc: v1SchemaUpdatesDoc,
    comments: v1Comments,
  },
  2: {
    schema: v2Schema,
    artifactContent: v2ArtifactContent,
    schemaUpdatesDoc: v2SchemaUpdatesDoc,
    comments: v2Comments,
  },
}

export const AVAILABLE_VERSIONS = [0, 1, 2] as const
export const DEFAULT_VERSION = 0
