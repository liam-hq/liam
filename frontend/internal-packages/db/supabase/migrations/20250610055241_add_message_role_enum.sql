begin;

CREATE TYPE "public"."message_role_enum" AS ENUM (
    'user',
    'assistant'
);

ALTER TYPE "public"."message_role_enum" OWNER TO "postgres";

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM "public"."messages" 
        WHERE "role" NOT IN ('user', 'assistant')
    ) THEN
        RAISE EXCEPTION 'Invalid role values found in messages table. All roles must be either ''user'' or ''assistant''';
    END IF;
END $$;

ALTER TABLE "public"."messages" 
ALTER COLUMN "role" TYPE "public"."message_role_enum" 
USING "role"::"public"."message_role_enum";

commit;
