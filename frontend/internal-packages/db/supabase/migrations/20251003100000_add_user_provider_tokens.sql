create table if not exists public.user_provider_tokens (
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_provider_tokens_pkey primary key (user_id, provider)
);

alter table public.user_provider_tokens enable row level security;

-- Allow users to manage only their own tokens
create policy user_provider_tokens_select_self
  on public.user_provider_tokens
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy user_provider_tokens_upsert_self
  on public.user_provider_tokens
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy user_provider_tokens_update_self
  on public.user_provider_tokens
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service role can access everything
grant all on table public.user_provider_tokens to service_role;

-- Keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_user_provider_tokens_updated_at on public.user_provider_tokens;
create trigger set_user_provider_tokens_updated_at
before update on public.user_provider_tokens
for each row execute function public.set_updated_at();

