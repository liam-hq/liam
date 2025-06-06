export const ddl = `
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
