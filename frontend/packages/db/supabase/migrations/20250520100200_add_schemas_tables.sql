begin;

-- create building_schema_versions table
create table if not exists public.building_schema_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  building_schema_id uuid not null references public.building_schemas(id) on delete cascade,
  number integer not null,
  created_at timestamp with time zone default now() not null,
  patch jsonb not null,
  reverse_patch jsonb not null
);

-- add indexes
create index if not exists building_schema_versions_building_schema_id_idx on public.building_schema_versions(building_schema_id);
create index if not exists building_schema_versions_number_idx on public.building_schema_versions(number);

-- add policies
alter table public.building_schema_versions enable row level security;

create policy "authenticated_users_can_select_org_building_schema_versions" 
  on public.building_schema_versions
  for select to "authenticated" 
  using (("organization_id" in ( 
    select "organization_members"."organization_id"
    from "public"."organization_members"
    where ("organization_members"."user_id" = "auth"."uid"())
  )));

create policy "authenticated_users_can_insert_org_building_schema_versions" 
  on public.building_schema_versions
  for insert to "authenticated" 
  with check (("organization_id" in ( 
    select "organization_members"."organization_id"
    from "public"."organization_members"
    where ("organization_members"."user_id" = "auth"."uid"())
  )));

create policy "authenticated_users_can_update_org_building_schema_versions" 
  on public.building_schema_versions
  for update to "authenticated" 
  using (("organization_id" in ( 
    select "organization_members"."organization_id"
    from "public"."organization_members"
    where ("organization_members"."user_id" = "auth"."uid"())
  )))
  with check (("organization_id" in ( 
    select "organization_members"."organization_id"
    from "public"."organization_members"
    where ("organization_members"."user_id" = "auth"."uid"())
  )));

create policy "authenticated_users_can_delete_org_building_schema_versions" 
  on public.building_schema_versions
  for delete to "authenticated" 
  using (("organization_id" in ( 
    select "organization_members"."organization_id"
    from "public"."organization_members"
    where ("organization_members"."user_id" = "auth"."uid"())
  )));

create or replace function "public"."set_building_schema_versions_organization_id"() returns "trigger"
  language "plpgsql" security definer
  as $$
begin
  new.organization_id := (
    select "organization_id" 
    from "public"."building_schemas"
    where "id" = new.building_schema_id
  );
  return new;
end;
$$;
alter function "public"."set_building_schema_versions_organization_id"() owner to "postgres";

create trigger "set_building_schema_versions_organization_id_trigger"
  before insert or update on "public"."building_schema_versions"
  for each row
  execute function "public"."set_building_schema_versions_organization_id"();

grant all on table "public"."building_schema_versions" to "anon";
grant all on table "public"."building_schema_versions" to "authenticated";
grant all on table "public"."building_schema_versions" to "service_role";

grant all on function "public"."set_building_schema_versions_organization_id"() to "anon";
grant all on function "public"."set_building_schema_versions_organization_id"() to "authenticated";
grant all on function "public"."set_building_schema_versions_organization_id"() to "service_role";

commit;
