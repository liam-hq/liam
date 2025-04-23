alter table public.users enable row level security;

create policy "users_same_organization_select_policy" on public.users
    for select to authenticated
    using (
        id in (
            -- user can select records of users who are in the same organization
            select u.id
            from public.users u
            join public.organization_members om1 on u.id = om1.user_id
            join public.organization_members om2 on om1.organization_id = om2.organization_id
            where om2.user_id = auth.uid()
        )
        or
        id = auth.uid() -- user can select their own record
    );
