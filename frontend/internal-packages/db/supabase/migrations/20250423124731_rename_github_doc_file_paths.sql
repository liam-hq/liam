
alter table "public"."knowledge_suggestion_doc_mappings" drop constraint if exists "knowledge_suggestion_doc_mapping_github_doc_file_path_id_fkey";

drop index if exists "public"."github_doc_file_path_path_project_id_key";

alter table "public"."github_doc_file_paths" rename to "doc_file_paths";

alter table "public"."knowledge_suggestion_doc_mappings" rename column "github_doc_file_path_id" to "doc_file_path_id";

alter table "public"."knowledge_suggestion_doc_mappings" add constraint "knowledge_suggestion_doc_mapping_doc_file_path_id_fkey"
  foreign key ("doc_file_path_id") references "public"."doc_file_paths"("id")
  on update cascade on delete cascade;

create unique index if not exists "doc_file_path_path_project_id_key"
  on "public"."doc_file_paths" using btree ("path", "project_id");

grant all on table "public"."doc_file_paths" to "anon";
grant all on table "public"."doc_file_paths" to "authenticated";
grant all on table "public"."doc_file_paths" to "service_role";
