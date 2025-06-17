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
