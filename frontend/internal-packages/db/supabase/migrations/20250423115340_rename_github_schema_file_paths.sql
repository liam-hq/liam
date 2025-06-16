BEGIN;

alter table "public"."github_schema_file_paths"
  drop constraint if exists "github_schema_file_path_path_project_id_key";

alter table "public"."github_schema_file_paths"
  drop constraint if exists "github_schema_file_path_project_id_fkey";

drop index if exists "public"."github_schema_file_path_path_project_id_key";
drop index if exists "public"."github_schema_file_path_project_id_key";

alter table "public"."github_schema_file_paths" rename to "schema_file_paths";

alter table "public"."schema_file_paths" add constraint "schema_file_path_project_id_fkey"
  foreign key ("project_id") references "public"."projects"("id")
  on update cascade on delete restrict;

create unique index if not exists "schema_file_path_path_project_id_key"
  on "public"."schema_file_paths" using btree ("path", "project_id");

create unique index if not exists "schema_file_path_project_id_key"
  on "public"."schema_file_paths" using btree ("project_id");

grant all on table "public"."schema_file_paths" to "anon";
grant all on table "public"."schema_file_paths" to "authenticated";
grant all on table "public"."schema_file_paths" to "service_role";

COMMIT;
