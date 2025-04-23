-- enable row level security on the users table
alter table public.users enable row level security;

-- create a policy that allows users to select their own record
-- and records of users who are in the same organization
create policy "users_same_organization_select_policy" on public.users
    for select to authenticated
    using (
        exists (
            -- user can select records of users who are in the same organization
            -- using exists to avoid infinite recursion
            select 1
            from public.organization_members om1
            join public.organization_members om2 on om1.organization_id = om2.organization_id
            where om1.user_id = public.users.id  -- the user being accessed
              and om2.user_id = auth.uid()  -- the authenticated user
        )
        or
        public.users.id = auth.uid() -- user can select their own record
    );
