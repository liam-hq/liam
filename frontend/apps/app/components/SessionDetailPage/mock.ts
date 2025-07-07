import type { ReviewComment } from './types'

export const SCHEMA_UPDATES_DOC = `-- Add updated_at column to users table
alter table users add column updated_at timestamp with time zone default now();
comment on column users.updated_at is 'Record update timestamp';

-- Create projects table
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

-- Create indexes
create index idx_projects_owner_id on projects (owner_id);

-- v2: Add task management functionality
-- Add status column to projects table
alter table projects add column status text not null default 'active';
alter table projects add constraint projects_status_check 
  check (status in ('active', 'completed', 'archived'));
comment on column projects.status is 'Project status';

-- Change foreign key constraint (more secure)
alter table projects drop constraint projects_owner_id_fkey;
alter table projects add constraint projects_owner_id_fkey 
  foreign key (owner_id) references users (id) on delete restrict;

-- Create tasks table
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

-- Create indexes
create index idx_tasks_project_id on tasks (project_id);
create index idx_tasks_assignee_id on tasks (assignee_id);
create index idx_tasks_status on tasks (status);
create index idx_tasks_due_date on tasks (due_date);
create index idx_projects_status on projects (status);
`

export const SCHEMA_UPDATES_REVIEW_COMMENTS: ReviewComment[] = [
  {
    fromLine: 8,
    toLine: 9,
    severity: 'High' as const,
    message:
      'Changing foreign key constraints may affect existing data. Please execute migrations carefully in production environments.',
  },
  {
    fromLine: 24,
    toLine: 26,
    severity: 'Medium' as const,
    message:
      'CHECK constraints prevent invalid data insertion, but we recommend implementing similar validation on the application side as well.',
  },
  {
    fromLine: 39,
    toLine: 42,
    severity: 'Low' as const,
    message:
      'Indexes are properly configured. Task search performance will be improved.',
  },
  {
    fromLine: 15,
    toLine: 15,
    severity: 'Medium' as const,
    message:
      'When assignee_id is NULL, it will be treated as an unassigned task. Please confirm this specification matches your business requirements.',
  },
]
