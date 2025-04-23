alter table public.users disable row level security;

drop policy "users_same_organization_select_policy" on public.users;
