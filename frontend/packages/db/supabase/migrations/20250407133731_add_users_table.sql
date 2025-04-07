-- Add users table with repository id and name columns
BEGIN;

-- Create users table
CREATE TABLE IF NOT EXISTS "public"."User" (
    "id" integer NOT NULL,
    "email" text NOT NULL,
    "name" text,
    "repositoryId" integer,
    "repositoryName" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

ALTER TABLE "public"."User" OWNER TO "postgres";

-- Create sequence for User id
CREATE SEQUENCE IF NOT EXISTS "public"."User_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE "public"."User_id_seq" OWNER TO "postgres";
ALTER SEQUENCE "public"."User_id_seq" OWNED BY "public"."User"."id";

-- Set default value for id column
ALTER TABLE ONLY "public"."User" ALTER COLUMN "id" SET DEFAULT nextval('"public"."User_id_seq"'::regclass);

-- Add primary key constraint
ALTER TABLE ONLY "public"."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- Add foreign key constraint for repositoryId
ALTER TABLE ONLY "public"."User"
    ADD CONSTRAINT "User_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "public"."Repository"("id");

-- Grant permissions
GRANT ALL ON TABLE "public"."User" TO "anon";
GRANT ALL ON TABLE "public"."User" TO "authenticated";
GRANT ALL ON TABLE "public"."User" TO "service_role";

GRANT ALL ON SEQUENCE "public"."User_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."User_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."User_id_seq" TO "service_role";

END;
