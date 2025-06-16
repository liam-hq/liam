-- rename repositories and pull_requests tables to follow github_ prefix pattern

-- drop foreign key constraints
alter table "public"."pull_requests" drop constraint if exists "pull_request_repository_id_fkey";
alter table "public"."project_repository_mappings" drop constraint if exists "project_repository_mapping_repository_id_fkey";
alter table "public"."migrations" drop constraint if exists "migration_pull_request_id_fkey";
alter table "public"."overall_reviews" drop constraint if exists "overall_review_pull_request_id_fkey";

-- drop indexes
drop index if exists "public"."pull_request_repository_id_pull_number_key";
drop index if exists "public"."repository_owner_name_key";

-- rename tables
alter table "public"."repositories" rename to "github_repositories";
alter table "public"."pull_requests" rename to "github_pull_requests";

-- recreate foreign key constraints
alter table "public"."github_pull_requests" add constraint "github_pull_request_repository_id_fkey"
  foreign key ("repository_id") references "public"."github_repositories"("id")
  on update cascade on delete restrict;

alter table "public"."project_repository_mappings" add constraint "project_repository_mapping_repository_id_fkey"
  foreign key ("repository_id") references "public"."github_repositories"("id")
  on update cascade on delete restrict;

alter table "public"."migrations" add constraint "migration_pull_request_id_fkey"
  foreign key ("pull_request_id") references "public"."github_pull_requests"("id")
  on update cascade on delete restrict;

alter table "public"."overall_reviews" add constraint "overall_review_pull_request_id_fkey"
  foreign key ("pull_request_id") references "public"."github_pull_requests"("id")
  on update cascade on delete restrict;

-- recreate indexes
create unique index if not exists "github_pull_request_repository_id_pull_number_key"
  on "public"."github_pull_requests" using btree ("repository_id", "pull_number");

create unique index if not exists "github_repository_owner_name_key"
  on "public"."github_repositories" using btree ("owner", "name");
