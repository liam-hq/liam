alter table "public"."invitations"
    add column "token" uuid not null default gen_random_uuid(),
    add column "expired_at" timestamp(3) with time zone not null default current_timestamp,
    add unique ("token");
