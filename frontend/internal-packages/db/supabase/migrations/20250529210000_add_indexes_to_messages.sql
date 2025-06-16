begin;

create index if not exists "idx_messages_design_session_created_at" on "public"."messages" ("design_session_id", "created_at" desc);

create index if not exists "idx_messages_role_created_at" on "public"."messages" ("role", "created_at" desc);

create index if not exists "idx_messages_user_id_created_at" on "public"."messages" ("user_id", "created_at" desc) where "user_id" is not null;

commit;
